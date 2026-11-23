import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import type {
  Cardapio,
  Colaborador,
  Organizacao,
  RegistroRefeicao,
} from '../../dominio/entidades.js';
import type { PerfilAlimentar, RestricaoAlimentar } from '../../dominio/valores.js';
import { normalizarTexto } from '../../util/documentos.js';
import type { Repositorios } from '../tipos.js';

const PASTA_MIGRACOES = fileURLToPath(new URL('../../../../database/migrations/', import.meta.url));

const tipos = {
  getTypeParser(oid: number, formato?: 'text' | 'binary') {
    if (oid === 1082) return (v: string) => v;
    if (oid === 1083) return (v: string) => v.slice(0, 5);
    if (oid === 1700) return (v: string) => Number(v);
    if (oid === 1184) return (v: string) => new Date(v).toISOString();
    return pg.types.getTypeParser(oid, formato);
  },
};

const idValido = (id: string) => /^\d{1,18}$/.test(id);
const n = (tabela: string) => `nutricorp.${tabela}`;

export function criarPool(url: string) {
  return new pg.Pool({
    connectionString: url,
    types: tipos,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
}

export async function migrar(pool: pg.Pool) {
  const cliente = await pool.connect();
  try {
    await cliente.query('SELECT pg_advisory_lock(20261123)');
    await cliente.query(
      'CREATE TABLE IF NOT EXISTS public.migracoes (nome text PRIMARY KEY, aplicada_em timestamptz NOT NULL DEFAULT now())',
    );
    const { rows } = await cliente.query<{ nome: string }>('SELECT nome FROM public.migracoes');
    const feitas = new Set(rows.map((r) => r.nome));
    const arquivos = (await readdir(PASTA_MIGRACOES)).filter((a) => a.endsWith('.sql')).sort();
    for (const arquivo of arquivos) {
      if (feitas.has(arquivo)) continue;
      const sql = await readFile(PASTA_MIGRACOES + arquivo, 'utf8');
      try {
        await cliente.query('BEGIN');
        await cliente.query(sql);
        await cliente.query('INSERT INTO public.migracoes (nome) VALUES ($1)', [arquivo]);
        await cliente.query('COMMIT');
        console.log(`Migração aplicada: ${arquivo}`);
      } catch (erro) {
        await cliente.query('ROLLBACK');
        throw erro;
      }
    }
  } finally {
    await cliente.query('SELECT pg_advisory_unlock(20261123)');
    cliente.release();
  }
}

async function emTransacao<T>(pool: pg.Pool, fn: (c: pg.PoolClient) => Promise<T>) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await fn(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (erro) {
    await cliente.query('ROLLBACK');
    throw erro;
  } finally {
    cliente.release();
  }
}

const SQL_ORGANIZACAO = `
  SELECT o.id_organizacao::text AS id, o.razao_social, o.cnpj, o.nome_fantasia, o.setor,
         o.criado_em, u.email, u.senha_hash
  FROM ${n('organizacoes')} o
  JOIN LATERAL (
    SELECT email, senha_hash FROM ${n('usuarios')}
    WHERE id_organizacao = o.id_organizacao AND papel = 'rh'
    ORDER BY id_usuario LIMIT 1
  ) u ON true`;

function paraOrganizacao(r: Record<string, any>): Organizacao {
  return {
    id: r.id,
    razaoSocial: r.razao_social,
    cnpj: r.cnpj,
    nomeFantasia: r.nome_fantasia,
    setor: r.setor,
    emailComunicacao: r.email,
    senhaHash: r.senha_hash,
    criadoEm: r.criado_em,
  };
}

const SQL_COLABORADOR = `
  SELECT id_usuario::text AS id, id_organizacao::text AS organizacao_id, nome, cpf, setor,
         codigo_funcionario, email, senha_hash, ativo, aprovado, criado_em
  FROM ${n('usuarios')} WHERE papel = 'colaborador'`;

function paraColaborador(r: Record<string, any>): Colaborador {
  return {
    id: r.id,
    organizacaoId: r.organizacao_id,
    nomeCompleto: r.nome,
    cpf: r.cpf,
    setor: r.setor ?? '',
    codigoFuncionario: r.codigo_funcionario,
    emailCorporativo: r.email,
    senhaHash: r.senha_hash,
    ativo: r.ativo,
    aprovado: r.aprovado,
    criadoEm: r.criado_em,
  };
}

const marcadores = (tipo: string) => `
  ARRAY(SELECT m.codigo FROM ${n('refeicoes_marcadores')} rm
        JOIN ${n('marcadores_alimentares')} m USING (id_marcador)
        WHERE rm.id_refeicao = r.id_refeicao AND rm.tipo_vinculo = '${tipo}'
        ORDER BY m.id_marcador)`;

const SQL_CARDAPIO = `
  SELECT c.id_cardapio::text AS id, c.id_organizacao::text AS organizacao_id, c.estado,
         c.data_servico, c.tipo_servico, c.unidade, c.horario_inicio, c.horario_fim,
         c.criado_em, c.atualizado_em, c.publicado_em,
         r.nome, r.descricao, r.composicao_revisada,
         ni.porcao_g, ni.energia_kcal, ni.carboidratos_g, ni.proteinas_g, ni.gorduras_g, ni.sodio_mg,
         ARRAY(SELECT i.nome FROM ${n('refeicoes_ingredientes')} ri
               JOIN ${n('ingredientes')} i ON i.id_ingrediente = ri.id_ingrediente
               WHERE ri.id_refeicao = r.id_refeicao ORDER BY ri.ordem) AS ingredientes,
         ${marcadores('contem')} AS alergenos,
         ${marcadores('pode_conter')} AS pode_conter,
         ${marcadores('adequada')} AS perfis
  FROM ${n('cardapios')} c
  JOIN ${n('itens_cardapio')} ic ON ic.id_cardapio = c.id_cardapio
  JOIN ${n('refeicoes')} r ON r.id_refeicao = ic.id_refeicao
  LEFT JOIN ${n('informacoes_nutricionais')} ni ON ni.id_refeicao = r.id_refeicao`;

function paraCardapio(r: Record<string, any>): Cardapio {
  return {
    id: r.id,
    organizacaoId: r.organizacao_id,
    estado: r.estado,
    nome: r.nome,
    data: r.data_servico,
    refeicao: r.tipo_servico,
    unidade: r.unidade,
    inicio: r.horario_inicio,
    fim: r.horario_fim,
    preparacoes: (r.descricao ?? '').split('\n').filter(Boolean),
    ingredientes: r.ingredientes,
    alergenos: r.alergenos as RestricaoAlimentar[],
    podeConter: r.pode_conter as RestricaoAlimentar[],
    perfisCompativeis: r.perfis as PerfilAlimentar[],
    revisado: r.composicao_revisada,
    nutricional: {
      porcaoGramas: r.porcao_g ?? null,
      energiaKcal: r.energia_kcal ?? null,
      carboidratosG: r.carboidratos_g ?? null,
      proteinasG: r.proteinas_g ?? null,
      gordurasG: r.gorduras_g ?? null,
      sodioMg: r.sodio_mg ?? null,
    },
    criadoEm: r.criado_em,
    atualizadoEm: r.atualizado_em,
    publicadoEm: r.publicado_em,
  };
}

async function salvarComposicao(c: pg.PoolClient, idRefeicao: string, cardapio: Omit<Cardapio, 'id'>) {
  await c.query(`DELETE FROM ${n('refeicoes_ingredientes')} WHERE id_refeicao = $1`, [idRefeicao]);
  await c.query(`DELETE FROM ${n('refeicoes_marcadores')} WHERE id_refeicao = $1`, [idRefeicao]);
  await c.query(`DELETE FROM ${n('informacoes_nutricionais')} WHERE id_refeicao = $1`, [idRefeicao]);

  const vistos = new Set<string>();
  let ordem = 0;
  for (const nome of cardapio.ingredientes) {
    const chave = normalizarTexto(nome);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    const { rows } = await c.query(
      `INSERT INTO ${n('ingredientes')} (id_organizacao, nome) VALUES ($1, $2)
       ON CONFLICT (id_organizacao, lower(btrim(nome))) DO UPDATE SET nome = ingredientes.nome
       RETURNING id_ingrediente`,
      [cardapio.organizacaoId, nome],
    );
    await c.query(
      `INSERT INTO ${n('refeicoes_ingredientes')} (id_organizacao, id_refeicao, id_ingrediente, ordem)
       VALUES ($1, $2, $3, $4)`,
      [cardapio.organizacaoId, idRefeicao, rows[0].id_ingrediente, ordem++],
    );
  }

  for (const [tipo, codigos] of [
    ['contem', cardapio.alergenos],
    ['pode_conter', cardapio.podeConter],
    ['adequada', cardapio.perfisCompativeis],
  ] as const) {
    await c.query(
      `INSERT INTO ${n('refeicoes_marcadores')} (id_refeicao, id_marcador, tipo_vinculo)
       SELECT $1, id_marcador, $2 FROM ${n('marcadores_alimentares')} WHERE codigo = ANY($3)`,
      [idRefeicao, tipo, codigos],
    );
  }

  const ni = cardapio.nutricional;
  if (Object.values(ni).some((v) => v !== null))
    await c.query(
      `INSERT INTO ${n('informacoes_nutricionais')}
       (id_refeicao, porcao_g, energia_kcal, carboidratos_g, proteinas_g, gorduras_g, sodio_mg)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [idRefeicao, ni.porcaoGramas, ni.energiaKcal, ni.carboidratosG, ni.proteinasG, ni.gordurasG, ni.sodioMg],
    );
}

const SQL_REGISTRO = `
  SELECT co.id_consumo::text AS id, co.id_usuario::text AS colaborador_id,
         co.id_organizacao::text AS organizacao_id, ic.id_cardapio::text AS cardapio_id,
         co.requisicao_id, co.data_consumo, co.tipo_refeicao, co.nome_refeicao, co.energia_kcal,
         co.observacoes, co.situacao, co.registrado_em
  FROM ${n('consumos')} co
  LEFT JOIN ${n('itens_cardapio')} ic ON ic.id_item_cardapio = co.id_item_cardapio`;

function paraRegistro(r: Record<string, any>): RegistroRefeicao {
  return {
    id: r.id,
    colaboradorId: r.colaborador_id,
    organizacaoId: r.organizacao_id,
    cardapioId: r.cardapio_id,
    requisicaoId: r.requisicao_id,
    data: r.data_consumo,
    tipo: r.tipo_refeicao,
    nomeRefeicao: r.nome_refeicao,
    energia: r.energia_kcal,
    observacoes: r.observacoes,
    situacao: r.situacao,
    registradoEm: r.registrado_em,
  };
}

export function criarRepositoriosPostgres(pool: pg.Pool): Repositorios {
  const um = async <T>(sql: string, params: unknown[], mapa: (r: any) => T) => {
    const { rows } = await pool.query(sql, params);
    return rows[0] ? mapa(rows[0]) : null;
  };
  const varios = async <T>(sql: string, params: unknown[], mapa: (r: any) => T) =>
    (await pool.query(sql, params)).rows.map(mapa);

  return {
    organizacoes: {
      async criar(dados) {
        const id = await emTransacao(pool, async (c) => {
          const { rows } = await c.query(
            `INSERT INTO ${n('organizacoes')} (razao_social, cnpj, nome_fantasia, setor, criado_em)
             VALUES ($1, $2, $3, $4, $5) RETURNING id_organizacao::text AS id`,
            [dados.razaoSocial, dados.cnpj, dados.nomeFantasia, dados.setor, dados.criadoEm],
          );
          await c.query(
            `INSERT INTO ${n('usuarios')} (id_organizacao, nome, email, senha_hash, papel, criado_em)
             VALUES ($1, $2, $3, $4, 'rh', $5)`,
            [rows[0].id, dados.nomeFantasia, dados.emailComunicacao, dados.senhaHash, dados.criadoEm],
          );
          return rows[0].id as string;
        });
        return { ...dados, id };
      },
      async alterarSenha(id, senhaHash) {
        await pool.query(
          `UPDATE ${n('usuarios')} SET senha_hash = $2 WHERE id_usuario = (
             SELECT id_usuario FROM ${n('usuarios')} WHERE id_organizacao = $1 AND papel = 'rh'
             ORDER BY id_usuario LIMIT 1)`,
          [id, senhaHash],
        );
      },
      async buscarPorId(id) {
        if (!idValido(id)) return null;
        return um(`${SQL_ORGANIZACAO} WHERE o.id_organizacao = $1`, [id], paraOrganizacao);
      },
      async buscarPorCnpj(cnpj) {
        return um(`${SQL_ORGANIZACAO} WHERE o.cnpj = $1`, [cnpj], paraOrganizacao);
      },
      async buscarPorEmail(email) {
        return um(`${SQL_ORGANIZACAO} WHERE lower(u.email) = lower($1)`, [email], paraOrganizacao);
      },
      async listarPorNome(nome) {
        const alvo = normalizarTexto(nome);
        const todas = await varios(SQL_ORGANIZACAO, [], paraOrganizacao);
        return todas.filter(
          (o) => normalizarTexto(o.nomeFantasia) === alvo || normalizarTexto(o.razaoSocial) === alvo,
        );
      },
    },

    colaboradores: {
      async criar(dados) {
        const { rows } = await pool.query(
          `INSERT INTO ${n('usuarios')}
           (id_organizacao, nome, email, senha_hash, papel, cpf, setor, codigo_funcionario, ativo, aprovado, criado_em)
           VALUES ($1, $2, $3, $4, 'colaborador', $5, $6, $7, $8, $9, $10) RETURNING id_usuario::text AS id`,
          [
            dados.organizacaoId,
            dados.nomeCompleto,
            dados.emailCorporativo,
            dados.senhaHash,
            dados.cpf,
            dados.setor,
            dados.codigoFuncionario,
            dados.ativo,
            dados.aprovado,
            dados.criadoEm,
          ],
        );
        return { ...dados, id: rows[0].id };
      },
      async atualizar(c) {
        await pool.query(
          `UPDATE ${n('usuarios')} SET nome = $2, setor = $3, codigo_funcionario = $4, ativo = $5,
             aprovado = $6, senha_hash = $7
           WHERE id_usuario = $1 AND papel = 'colaborador'`,
          [c.id, c.nomeCompleto, c.setor, c.codigoFuncionario, c.ativo, c.aprovado, c.senhaHash],
        );
      },
      async buscarPorId(id) {
        if (!idValido(id)) return null;
        return um(`${SQL_COLABORADOR} AND id_usuario = $1`, [id], paraColaborador);
      },
      async buscarPorEmail(email) {
        return um(`${SQL_COLABORADOR} AND lower(email) = lower($1)`, [email], paraColaborador);
      },
      async buscarPorCpf(cpf) {
        return um(`${SQL_COLABORADOR} AND cpf = $1`, [cpf], paraColaborador);
      },
      async buscarPorCodigo(organizacaoId, codigo) {
        return um(
          `${SQL_COLABORADOR} AND id_organizacao = $1 AND codigo_funcionario = $2`,
          [organizacaoId, codigo],
          paraColaborador,
        );
      },
      async listarPorOrganizacao(organizacaoId) {
        return varios(
          `${SQL_COLABORADOR} AND id_organizacao = $1 ORDER BY nome`,
          [organizacaoId],
          paraColaborador,
        );
      },
    },

    preferencias: {
      async buscar(colaboradorId) {
        if (!idValido(colaboradorId)) return null;
        return um(
          `SELECT p.alimentos_evitar, p.outras_orientacoes, p.consentimento_em, p.atualizado_em,
             (SELECT m.codigo FROM ${n('perfis_alimentares')} pa
              JOIN ${n('marcadores_alimentares')} m USING (id_marcador)
              WHERE pa.id_usuario = p.id_usuario AND pa.tipo_vinculo = 'preferencia' LIMIT 1) AS perfil,
             ARRAY(SELECT m.codigo FROM ${n('perfis_alimentares')} pa
                   JOIN ${n('marcadores_alimentares')} m USING (id_marcador)
                   WHERE pa.id_usuario = p.id_usuario AND pa.tipo_vinculo = 'restricao'
                   ORDER BY m.id_marcador) AS restricoes
           FROM ${n('preferencias_colaborador')} p WHERE p.id_usuario = $1`,
          [colaboradorId],
          (r) => ({
            colaboradorId,
            perfil: r.perfil ?? 'sem_preferencia',
            restricoes: r.restricoes,
            alimentosEvitar: r.alimentos_evitar,
            outrasOrientacoes: r.outras_orientacoes,
            consentimentoEm: r.consentimento_em,
            atualizadoEm: r.atualizado_em,
          }),
        );
      },
      async remover(colaboradorId) {
        if (!idValido(colaboradorId)) return;
        await pool.query(`DELETE FROM ${n('perfis_alimentares')} WHERE id_usuario = $1`, [colaboradorId]);
        await pool.query(`DELETE FROM ${n('preferencias_colaborador')} WHERE id_usuario = $1`, [colaboradorId]);
      },
      async salvar(p) {
        await emTransacao(pool, async (c) => {
          await c.query(
            `INSERT INTO ${n('preferencias_colaborador')}
               (id_usuario, alimentos_evitar, outras_orientacoes, consentimento_em, atualizado_em)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id_usuario) DO UPDATE
             SET alimentos_evitar = $2, outras_orientacoes = $3, consentimento_em = $4, atualizado_em = $5`,
            [p.colaboradorId, p.alimentosEvitar, p.outrasOrientacoes, p.consentimentoEm, p.atualizadoEm],
          );
          await c.query(`DELETE FROM ${n('perfis_alimentares')} WHERE id_usuario = $1`, [p.colaboradorId]);
          await c.query(
            `INSERT INTO ${n('perfis_alimentares')} (id_usuario, id_marcador, tipo_vinculo)
             SELECT $1, id_marcador, CASE WHEN categoria = 'perfil' THEN 'preferencia' ELSE 'restricao' END
             FROM ${n('marcadores_alimentares')} WHERE codigo = ANY($2)`,
            [p.colaboradorId, [...p.restricoes, p.perfil]],
          );
        });
      },
    },

    cardapios: {
      async criar(dados) {
        const id = await emTransacao(pool, async (c) => {
          const refeicao = await c.query(
            `INSERT INTO ${n('refeicoes')} (id_organizacao, nome, descricao, composicao_revisada)
             VALUES ($1, $2, $3, $4) RETURNING id_refeicao::text AS id`,
            [dados.organizacaoId, dados.nome, dados.preparacoes.join('\n'), dados.revisado],
          );
          const cardapio = await c.query(
            `INSERT INTO ${n('cardapios')} (id_organizacao, data_servico, tipo_servico, estado, unidade,
               horario_inicio, horario_fim, criado_em, atualizado_em, publicado_em)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id_cardapio::text AS id`,
            [
              dados.organizacaoId,
              dados.data,
              dados.refeicao,
              dados.estado,
              dados.unidade,
              dados.inicio,
              dados.fim,
              dados.criadoEm,
              dados.atualizadoEm,
              dados.publicadoEm,
            ],
          );
          await c.query(
            `INSERT INTO ${n('itens_cardapio')} (id_organizacao, id_cardapio, id_refeicao) VALUES ($1, $2, $3)`,
            [dados.organizacaoId, cardapio.rows[0].id, refeicao.rows[0].id],
          );
          await salvarComposicao(c, refeicao.rows[0].id, dados);
          return cardapio.rows[0].id as string;
        });
        return { ...dados, id };
      },
      async atualizar(dados) {
        await emTransacao(pool, async (c) => {
          const { rows } = await c.query(
            `SELECT id_refeicao::text AS id FROM ${n('itens_cardapio')} WHERE id_cardapio = $1`,
            [dados.id],
          );
          if (!rows[0]) return;
          await c.query(
            `UPDATE ${n('cardapios')} SET data_servico = $2, tipo_servico = $3, estado = $4, unidade = $5,
               horario_inicio = $6, horario_fim = $7, atualizado_em = $8, publicado_em = $9
             WHERE id_cardapio = $1`,
            [
              dados.id,
              dados.data,
              dados.refeicao,
              dados.estado,
              dados.unidade,
              dados.inicio,
              dados.fim,
              dados.atualizadoEm,
              dados.publicadoEm,
            ],
          );
          await c.query(
            `UPDATE ${n('refeicoes')} SET nome = $2, descricao = $3, composicao_revisada = $4 WHERE id_refeicao = $1`,
            [rows[0].id, dados.nome, dados.preparacoes.join('\n'), dados.revisado],
          );
          await salvarComposicao(c, rows[0].id, dados);
        });
      },
      async remover(id) {
        if (!idValido(id)) return;
        await emTransacao(pool, async (c) => {
          const { rows } = await c.query(
            `DELETE FROM ${n('itens_cardapio')} WHERE id_cardapio = $1 RETURNING id_refeicao`,
            [id],
          );
          await c.query(`DELETE FROM ${n('cardapios')} WHERE id_cardapio = $1`, [id]);
          for (const { id_refeicao } of rows) {
            await c.query(`DELETE FROM ${n('refeicoes_ingredientes')} WHERE id_refeicao = $1`, [id_refeicao]);
            await c.query(`DELETE FROM ${n('informacoes_nutricionais')} WHERE id_refeicao = $1`, [id_refeicao]);
            await c.query(`DELETE FROM ${n('refeicoes')} WHERE id_refeicao = $1`, [id_refeicao]);
          }
        });
      },
      async buscarPorId(id) {
        if (!idValido(id)) return null;
        return um(`${SQL_CARDAPIO} WHERE c.id_cardapio = $1`, [id], paraCardapio);
      },
      async listar(f) {
        const condicoes = ['c.id_organizacao = $1'];
        const params: unknown[] = [f.organizacaoId];
        const filtro = (sql: string, valor: unknown) => {
          if (valor === undefined) return;
          params.push(valor);
          condicoes.push(`${sql} $${params.length}`);
        };
        filtro('c.estado =', f.estado);
        filtro('c.data_servico =', f.data);
        filtro('c.tipo_servico =', f.refeicao);
        filtro('c.data_servico >=', f.dataInicio);
        filtro('c.data_servico <=', f.dataFim);
        return varios(
          `${SQL_CARDAPIO} WHERE ${condicoes.join(' AND ')}
           ORDER BY c.data_servico NULLS LAST, c.horario_inicio NULLS FIRST, r.nome`,
          params,
          paraCardapio,
        );
      },
    },

    registros: {
      async criar(dados) {
        const { rows } = await pool.query(
          `INSERT INTO ${n('consumos')} (id_organizacao, id_usuario, id_item_cardapio, consumido_em,
             requisicao_id, data_consumo, tipo_refeicao, nome_refeicao, energia_kcal, observacoes,
             situacao, registrado_em)
           SELECT $1, $2, ic.id_item_cardapio,
             ($4::date + coalesce(c.horario_inicio, '12:00')) AT TIME ZONE 'America/Sao_Paulo',
             $5, $4, $6, $7, $8, $9, $10, $11
           FROM ${n('itens_cardapio')} ic JOIN ${n('cardapios')} c ON c.id_cardapio = ic.id_cardapio
           WHERE ic.id_cardapio = $3
           ON CONFLICT (id_usuario, requisicao_id) DO NOTHING
           RETURNING id_consumo::text AS id`,
          [
            dados.organizacaoId,
            dados.colaboradorId,
            dados.cardapioId,
            dados.data,
            dados.requisicaoId,
            dados.tipo,
            dados.nomeRefeicao,
            dados.energia,
            dados.observacoes,
            dados.situacao,
            dados.registradoEm,
          ],
        );
        return rows[0] ? { ...dados, id: rows[0].id } : null;
      },
      async atualizar(r) {
        await pool.query(`UPDATE ${n('consumos')} SET observacoes = $2 WHERE id_consumo = $1`, [
          r.id,
          r.observacoes,
        ]);
      },
      async remover(id) {
        if (!idValido(id)) return;
        await pool.query(`DELETE FROM ${n('consumos')} WHERE id_consumo = $1`, [id]);
      },
      async buscarPorId(id) {
        if (!idValido(id)) return null;
        return um(`${SQL_REGISTRO} WHERE co.id_consumo = $1`, [id], paraRegistro);
      },
      async buscarPorRequisicao(colaboradorId, requisicaoId) {
        if (!idValido(colaboradorId)) return null;
        return um(
          `${SQL_REGISTRO} WHERE co.id_usuario = $1 AND co.requisicao_id = $2`,
          [colaboradorId, requisicaoId],
          paraRegistro,
        );
      },
      async listarPorColaborador(colaboradorId) {
        return varios(
          `${SQL_REGISTRO} WHERE co.id_usuario = $1 ORDER BY co.data_consumo DESC, co.registrado_em DESC`,
          [colaboradorId],
          paraRegistro,
        );
      },
      async listarPorOrganizacao(organizacaoId, dataInicio, dataFim) {
        return varios(
          `${SQL_REGISTRO} WHERE co.id_organizacao = $1 AND co.data_consumo BETWEEN $2 AND $3`,
          [organizacaoId, dataInicio, dataFim],
          paraRegistro,
        );
      },
    },

    selecoes: {
      async buscar(colaboradorId, cardapioId) {
        if (!idValido(colaboradorId) || !idValido(cardapioId)) return null;
        return um(
          `SELECT id_cardapio_alternativa::text AS alternativa, selecionado_em
           FROM ${n('selecoes_alternativas')} WHERE id_usuario = $1 AND id_cardapio = $2`,
          [colaboradorId, cardapioId],
          (r) => ({ colaboradorId, cardapioId, alternativaId: r.alternativa, selecionadoEm: r.selecionado_em }),
        );
      },
      async salvar(s) {
        await pool.query(
          `INSERT INTO ${n('selecoes_alternativas')} (id_usuario, id_cardapio, id_cardapio_alternativa, selecionado_em)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id_usuario, id_cardapio) DO UPDATE SET id_cardapio_alternativa = $3, selecionado_em = $4`,
          [s.colaboradorId, s.cardapioId, s.alternativaId, s.selecionadoEm],
        );
      },
    },

    encerrar: () => pool.end(),
  };
}
