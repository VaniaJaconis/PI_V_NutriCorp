import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { criarApp } from '../src/app.js';
import { carregarConfig } from '../src/config.js';
import { popularDadosDemo } from '../src/dadosDemo.js';
import { criarRepositoriosEmMemoria } from '../src/repositorios/memoria/index.js';
import { criarPool, criarRepositoriosPostgres, migrar } from '../src/repositorios/postgres/index.js';
import type { Repositorios } from '../src/repositorios/tipos.js';
import { criarServicos } from '../src/servicos/index.js';
import { hoje, somarDias } from '../src/util/datas.js';

const bancos: [string, string][] = [['memória', '']];
if (process.env.TEST_DATABASE_URL) bancos.push(['PostgreSQL', process.env.TEST_DATABASE_URL]);

async function montar(url = '', buscarCnpj?: typeof fetch) {
  const config = carregarConfig({ NODE_ENV: 'test' });
  let repos: Repositorios;
  if (url) {
    const pool = criarPool(url);
    await pool.query('DROP SCHEMA IF EXISTS nutricorp CASCADE; DROP TABLE IF EXISTS public.migracoes');
    await migrar(pool);
    repos = criarRepositoriosPostgres(pool);
  } else {
    repos = criarRepositoriosEmMemoria();
  }
  const servicos = criarServicos(repos, config, buscarCnpj);
  return { app: criarApp(servicos, config), servicos, repos };
}

const SENHA = 'SenhaForte123';
const organizacao = {
  razaoSocial: 'Indústria Alfa S.A.',
  cnpj: '44.555.666/0001-81',
  nomeFantasia: 'Alfa',
  setor: 'Indústria',
  emailComunicacao: 'rh@alfa.com.br',
  senha: SENHA,
};
const colaborador = {
  nomeCompleto: 'Maria da Silva',
  cpf: '123.456.789-09',
  empresa: 'alfa',
  setor: 'Produção',
  codigoFuncionario: 'A-1',
  emailCorporativo: 'Maria@Alfa.com.br',
  senha: SENHA,
};
const nutricional = {
  porcaoGramas: 450,
  energiaKcal: 600,
  carboidratosG: 70,
  proteinasG: 30,
  gordurasG: 15,
  sodioMg: 800,
};
const cardapioBase = {
  estado: 'publicado',
  data: hoje(),
  refeicao: 'Almoço',
  unidade: 'Refeitório',
  inicio: '11:30',
  fim: '14:00',
  revisado: true,
  nutricional,
};

describe.each(bancos)('fluxo principal da API (%s)', (_nome, url) => {
  let app: Express;
  let repos: Repositorios;
  const api = () => request(app);
  let tokenOrg = '';
  let tokenCozinha = '';
  let tokenColab = '';
  let colaboradorId = '';
  let tradicionalId = '';
  let vegetarianoId = '';
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  afterAll(async () => {
    await repos?.encerrar?.();
  });

  beforeAll(async () => {
    ({ app, repos } = await montar(url));
    const org = await api().post('/api/organizacoes').send(organizacao);
    expect(org.status).toBe(201);
    expect(org.body).toMatchObject({ perfil: 'organizacao', nome: 'Alfa', modo: 'api' });
    tokenOrg = org.body.token;

    const colab = await api().post('/api/colaboradores').send(colaborador);
    expect(colab.status).toBe(201);
    expect(colab.body).toMatchObject({
      situacao: 'pendente',
      organizacao: { nome: 'Alfa' },
    });
    expect(colab.body).not.toHaveProperty('token');
    colaboradorId = colab.body.id;

    const pendente = await api()
      .post('/api/auth/login')
      .send({ usuario: colaborador.emailCorporativo, senha: SENHA });
    expect(pendente.status).toBe(403);
    expect(pendente.body.erro.codigo).toBe('acesso_pendente');

    const lista = await api().get('/api/organizacao/colaboradores').set(bearer(tokenOrg));
    expect(lista.body[0]).toMatchObject({ id: colaboradorId, aprovado: false, ativo: false });
    const aprovado = await api()
      .patch(`/api/organizacao/colaboradores/${colaboradorId}`)
      .set(bearer(tokenOrg))
      .send({ ativo: true });
    expect(aprovado.body).toMatchObject({ aprovado: true, ativo: true });

    const novo = await api()
      .post('/api/organizacao/equipe')
      .set(bearer(tokenOrg))
      .send({ nome: 'Rita Cozinha', email: 'rita@alfa.com.br', papel: 'cozinha' });
    expect(novo.status).toBe(201);
    expect(novo.body.membro).toMatchObject({ papel: 'cozinha', ativo: true, titular: false });
    const loginCozinha = await api()
      .post('/api/auth/login')
      .send({ usuario: 'rita@alfa.com.br', senha: novo.body.senhaTemporaria });
    expect(loginCozinha.body).toMatchObject({ perfil: 'organizacao', papel: 'cozinha', nome: 'Rita Cozinha' });
    tokenCozinha = loginCozinha.body.token;
  });

  it('separa as permissões de RH e Cozinha', async () => {
    const cardapioRh = await api()
      .post('/api/organizacao/cardapios')
      .set(bearer(tokenOrg))
      .send({ estado: 'rascunho', nome: 'Tentativa do RH' });
    expect(cardapioRh.status).toBe(403);
    expect((await api().get('/api/organizacao/cardapios').set(bearer(tokenOrg))).status).toBe(200);
    expect((await api().get('/api/organizacao/colaboradores').set(bearer(tokenCozinha))).status).toBe(403);
    expect((await api().get('/api/organizacao/equipe').set(bearer(tokenCozinha))).status).toBe(403);
    expect((await api().get('/api/organizacao/indicadores').set(bearer(tokenCozinha))).status).toBe(200);

    const sessao = await api().get('/api/auth/sessao').set(bearer(tokenOrg));
    expect(sessao.body).toMatchObject({ papel: 'rh' });
    const equipe = await api().get('/api/organizacao/equipe').set(bearer(tokenOrg));
    expect(equipe.body.map((m: { papel: string; titular: boolean }) => [m.papel, m.titular])).toEqual([
      ['rh', true],
      ['cozinha', false],
    ]);
    const duplicado = await api()
      .post('/api/organizacao/equipe')
      .set(bearer(tokenOrg))
      .send({ nome: 'Outra', email: colaborador.emailCorporativo, papel: 'rh' });
    expect(duplicado.status).toBe(409);
  });

  it('valida o cadastro com mensagens por campo', async () => {
    const resposta = await api()
      .post('/api/organizacoes')
      .send({ ...organizacao, cnpj: '11.111.111/1111-11', senha: '123', emailComunicacao: 'x' });
    expect(resposta.status).toBe(422);
    expect(resposta.body.erro.campos).toMatchObject({
      cnpj: 'Informe um CNPJ válido.',
      senha: 'Use pelo menos 8 caracteres.',
      emailComunicacao: 'Informe um e-mail válido.',
    });
  });

  it('recusa cadastros duplicados e empresa desconhecida', async () => {
    const duplicada = await api().post('/api/organizacoes').send(organizacao);
    expect(duplicada.status).toBe(409);
    expect(Object.keys(duplicada.body.erro.campos)).toEqual(['cnpj', 'emailComunicacao']);

    const semEmpresa = await api()
      .post('/api/colaboradores')
      .send({ ...colaborador, empresa: 'Beta', cpf: '111.444.777-35', emailCorporativo: 'b@b.com' });
    expect(semEmpresa.status).toBe(422);
    expect(semEmpresa.body.erro.campos.empresa).toMatch(/não encontrada/);
  });

  it('autentica pelo e-mail e recupera a sessão', async () => {
    const errado = await api()
      .post('/api/auth/login')
      .send({ usuario: 'maria@alfa.com.br', senha: 'errada123' });
    expect(errado.status).toBe(401);

    const login = await api()
      .post('/api/auth/login')
      .send({ usuario: ' MARIA@alfa.com.br ', senha: SENHA });
    expect(login.status).toBe(200);
    tokenColab = login.body.token;

    const sessao = await api().get('/api/auth/sessao').set(bearer(tokenColab));
    expect(sessao.body).toMatchObject({ id: colaboradorId, perfil: 'colaborador' });
  });

  it('aplica o controle de acesso por perfil', async () => {
    expect((await api().get('/api/cardapios')).status).toBe(401);
    expect((await api().get('/api/cardapios').set(bearer('invalido'))).status).toBe(401);
    expect(
      (await api().get('/api/organizacao/indicadores').set(bearer(tokenColab))).status,
    ).toBe(403);
    expect(
      (await api().get('/api/colaborador/preferencias').set(bearer(tokenOrg))).status,
    ).toBe(403);
  });

  it('salva e consulta preferências só com consentimento', async () => {
    const padrao = await api().get('/api/colaborador/preferencias').set(bearer(tokenColab));
    expect(padrao.body).toMatchObject({ perfil: 'sem_preferencia', atualizadoEm: null, consentimentoEm: null });

    const entrada = { perfil: 'vegetariana', restricoes: ['lactose', 'lactose'], alimentosEvitar: 'pimentão' };
    const semAceite = await api().put('/api/colaborador/preferencias').set(bearer(tokenColab)).send(entrada);
    expect(semAceite.status).toBe(422);
    expect(semAceite.body.erro.campos.consentimento).toBe('Autorize o uso destes dados para salvar.');

    const salvo = await api()
      .put('/api/colaborador/preferencias')
      .set(bearer(tokenColab))
      .send({ ...entrada, consentimento: true });
    expect(salvo.status).toBe(200);
    expect(salvo.body.preferencias.restricoes).toEqual(['lactose']);
    expect(salvo.body.preferencias.consentimentoEm).toBeTruthy();
  });

  it('exige todos os campos para publicar, mas aceita rascunho só com nome', async () => {
    const incompleto = await api()
      .post('/api/organizacao/cardapios')
      .set(bearer(tokenCozinha))
      .send({ estado: 'publicado', nome: 'Sem dados' });
    expect(incompleto.status).toBe(422);
    expect(incompleto.body.erro.campos).toMatchObject({
      data: 'Preencha este campo antes de publicar.',
      'nutricional.energiaKcal': 'Preencha este campo antes de publicar.',
      revisado: 'Revise e confirme os ingredientes e alérgenos antes de publicar.',
    });

    const rascunho = await api()
      .post('/api/organizacao/cardapios')
      .set(bearer(tokenCozinha))
      .send({ estado: 'rascunho', nome: 'Rascunho' });
    expect(rascunho.status).toBe(201);
    expect(rascunho.body).toMatchObject({ estado: 'rascunho', publicadoEm: null });
  });

  it('publica cardápios e avalia a compatibilidade para o colaborador', async () => {
    const tradicional = await api()
      .post('/api/organizacao/cardapios')
      .set(bearer(tokenCozinha))
      .send({
        ...cardapioBase,
        nome: 'Tradicional',
        preparacoes: ['Arroz', 'Frango', 'Purê'],
        ingredientes: ['Arroz', 'Frango', 'Batata', 'Leite'],
        alergenos: ['lactose'],
      });
    expect(tradicional.status).toBe(201);
    tradicionalId = tradicional.body.id;

    const vegetariano = await api()
      .post('/api/organizacao/cardapios')
      .set(bearer(tokenCozinha))
      .send({
        ...cardapioBase,
        nome: 'Vegetariano',
        preparacoes: ['Arroz integral', 'Tofu'],
        ingredientes: ['Arroz integral', 'Tofu de soja'],
        alergenos: ['soja'],
        perfisCompativeis: ['vegetariana', 'vegana'],
      });
    vegetarianoId = vegetariano.body.id;

    const lista = await api().get('/api/cardapios').set(bearer(tokenColab));
    expect(lista.body).toHaveLength(2);
    const situacoes = Object.fromEntries(
      lista.body.map((r: { titulo: string; avaliacoes: { situacao: string }[] }) => [
        r.titulo,
        r.avaliacoes[0]!.situacao,
      ]),
    );
    expect(situacoes).toEqual({ Tradicional: 'incompativel', Vegetariano: 'compativel' });

    const daOrganizacao = await api().get('/api/cardapios').set(bearer(tokenOrg));
    expect(daOrganizacao.body).toHaveLength(3);
  });

  it('sugere e seleciona alternativa compatível', async () => {
    const compat = await api()
      .get(`/api/colaborador/cardapios/${tradicionalId}/compatibilidade`)
      .set(bearer(tokenColab));
    expect(compat.status).toBe(200);
    expect(compat.body.avaliacoes[0].alertas).toEqual([
      'Contém lactose.',
      'Prato incompatível com o perfil alimentar selecionado.',
    ]);
    expect(compat.body.alternativas.map((a: { refeicaoId: string }) => a.refeicaoId)).toEqual([
      vegetarianoId,
    ]);

    const selecao = await api()
      .put(`/api/colaborador/cardapios/${tradicionalId}/alternativa`)
      .set(bearer(tokenColab))
      .send({ alternativaId: vegetarianoId });
    expect(selecao.body).toEqual({ alternativaSelecionada: vegetarianoId, modo: 'api' });

    const incompativel = await api()
      .put(`/api/colaborador/cardapios/${vegetarianoId}/alternativa`)
      .set(bearer(tokenColab))
      .send({ alternativaId: tradicionalId });
    expect(incompativel.status).toBe(422);
  });

  it('registra refeições sem duplicar envios repetidos', async () => {
    const opcoes = await api().get('/api/colaborador/registros/opcoes').set(bearer(tokenColab));
    expect(opcoes.body).toHaveLength(2);

    const entrada = {
      data: hoje(),
      tipo: 'Almoço',
      opcaoId: vegetarianoId,
      requisicaoId: 'req-1',
    };
    const [primeiro, repetido] = await Promise.all([
      api().post('/api/colaborador/registros').set(bearer(tokenColab)).send(entrada),
      api().post('/api/colaborador/registros').set(bearer(tokenColab)).send(entrada),
    ]);
    expect([primeiro.status, repetido.status].sort()).toEqual([200, 201]);
    expect(primeiro.body.id).toBe(repetido.body.id);
    expect(primeiro.body).toMatchObject({ energia: 600, situacao: 'compativel' });

    const futuro = await api()
      .post('/api/colaborador/registros')
      .set(bearer(tokenColab))
      .send({ ...entrada, data: somarDias(hoje(), 1), requisicaoId: 'req-2' });
    expect(futuro.body.erro.campos.data).toBe('A data de consumo não pode estar no futuro.');

    const tipoErrado = await api()
      .post('/api/colaborador/registros')
      .set(bearer(tokenColab))
      .send({ ...entrada, tipo: 'Jantar', requisicaoId: 'req-3' });
    expect(tipoErrado.body.erro.campos.opcaoId).toMatch(/indisponível/);

    const historico = await api().get('/api/colaborador/registros').set(bearer(tokenColab));
    expect(historico.body).toHaveLength(1);
  });

  it('consolida os indicadores da organização', async () => {
    const resposta = await api().get('/api/organizacao/indicadores').set(bearer(tokenOrg));
    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      colaboradoresAtivos: 1,
      refeicoesRegistradas: 1,
      taxaAdesao: 100,
      cardapiosPublicados: 2,
      compatibilidade: { compativeis: 100, parciais: 0, incompativeis: 0 },
    });
    expect(resposta.body.registrosPorDia).toHaveLength(7);
    expect(resposta.body.registrosPorDia.at(-1)).toMatchObject({ data: hoje(), valor: 1, percentual: 100 });
  });

  it('recusa períodos de indicadores fora do limite', async () => {
    for (const consulta of [
      '?inicio=9999-12-30&fim=9999-12-31',
      '?fim=0000-01-03',
      '?inicio=1900-01-01&fim=2100-12-31',
    ]) {
      const resposta = await api()
        .get(`/api/organizacao/indicadores${consulta}`)
        .set(bearer(tokenOrg));
      expect(resposta.status).toBe(422);
    }
  });

  it('edita e exclui o próprio registro', async () => {
    const novo = await api()
      .post('/api/colaborador/registros')
      .set(bearer(tokenColab))
      .send({ data: hoje(), tipo: 'Almoço', opcaoId: vegetarianoId, requisicaoId: 'req-editar' });
    const editado = await api()
      .patch(`/api/colaborador/registros/${novo.body.id}`)
      .set(bearer(tokenColab))
      .send({ observacoes: 'Meia porção.' });
    expect(editado.body.observacoes).toBe('Meia porção.');

    const removido = await api().delete(`/api/colaborador/registros/${novo.body.id}`).set(bearer(tokenColab));
    expect(removido.status).toBe(204);
    const historico = await api().get('/api/colaborador/registros').set(bearer(tokenColab));
    expect(historico.body.map((r: { id: string }) => r.id)).not.toContain(novo.body.id);
    expect((await api().delete('/api/colaborador/registros/999').set(bearer(tokenColab))).status).toBe(404);
  });

  it('gera senha temporária e permite trocar a senha', async () => {
    const gerada = await api()
      .post(`/api/organizacao/colaboradores/${colaboradorId}/senha`)
      .set(bearer(tokenOrg));
    expect(gerada.body.senhaTemporaria.length).toBeGreaterThanOrEqual(8);

    const login = await api()
      .post('/api/auth/login')
      .send({ usuario: colaborador.emailCorporativo, senha: gerada.body.senhaTemporaria });
    expect(login.status).toBe(200);

    const errada = await api()
      .put('/api/auth/senha')
      .set(bearer(login.body.token))
      .send({ senhaAtual: 'errada123', novaSenha: SENHA });
    expect(errada.body.erro.campos.senhaAtual).toBe('Senha atual incorreta.');
    const trocada = await api()
      .put('/api/auth/senha')
      .set(bearer(login.body.token))
      .send({ senhaAtual: gerada.body.senhaTemporaria, novaSenha: SENHA });
    expect(trocada.status).toBe(204);
    tokenColab = login.body.token;
  });

  it('exclui as preferências a pedido do colaborador', async () => {
    const resposta = await api().delete('/api/colaborador/preferencias').set(bearer(tokenColab));
    expect(resposta.body).toMatchObject({ perfil: 'sem_preferencia', restricoes: [], consentimentoEm: null });
  });

  it('isola os dados entre organizações', async () => {
    const outra = await api().post('/api/organizacoes').send({
      ...organizacao,
      cnpj: '11.222.333/0001-81',
      emailComunicacao: 'rh@outra.com.br',
      nomeFantasia: 'Outra',
    });
    const token = outra.body.token;
    expect((await api().get(`/api/cardapios/${tradicionalId}`).set(bearer(token))).status).toBe(404);
    expect((await api().get('/api/organizacao/colaboradores').set(bearer(token))).body).toEqual([]);
  });

  it('bloqueia o colaborador desativado na hora', async () => {
    const lista = await api().get('/api/organizacao/colaboradores').set(bearer(tokenOrg));
    expect(lista.body[0]).not.toHaveProperty('cpf');

    const desativado = await api()
      .patch(`/api/organizacao/colaboradores/${colaboradorId}`)
      .set(bearer(tokenOrg))
      .send({ ativo: false });
    expect(desativado.body.ativo).toBe(false);

    const comTokenAntigo = await api().get('/api/cardapios').set(bearer(tokenColab));
    expect(comTokenAntigo.status).toBe(403);
    const login = await api()
      .post('/api/auth/login')
      .send({ usuario: colaborador.emailCorporativo, senha: SENHA });
    expect(login.body.erro.codigo).toBe('acesso_inativo');
  });

  it('desativa e gera nova senha para a equipe', async () => {
    const equipe = await api().get('/api/organizacao/equipe').set(bearer(tokenOrg));
    const rita = equipe.body.find((m: { titular: boolean }) => !m.titular);
    const senha = await api().post(`/api/organizacao/equipe/${rita.id}/senha`).set(bearer(tokenOrg));
    const login = await api()
      .post('/api/auth/login')
      .send({ usuario: 'rita@alfa.com.br', senha: senha.body.senhaTemporaria });
    expect(login.status).toBe(200);

    await api().patch(`/api/organizacao/equipe/${rita.id}`).set(bearer(tokenOrg)).send({ ativo: false });
    expect((await api().get('/api/organizacao/indicadores').set(bearer(login.body.token))).status).toBe(403);
    expect(
      (await api().patch(`/api/organizacao/equipe/${equipe.body[0].id}`).set(bearer(tokenOrg)).send({ ativo: false }))
        .status,
    ).toBe(404);
  });
});

describe('infraestrutura', () => {
  it('responde JSON inválido e rota inexistente no formato de erro', async () => {
    const { app } = await montar();
    const invalido = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{');
    expect(invalido.status).toBe(400);
    expect(invalido.body.erro.codigo).toBe('json_invalido');
    expect((await request(app).get('/api/nada')).body.erro.codigo).toBe('nao_encontrado');
  });

  it('publica o contrato OpenAPI', async () => {
    const { app } = await montar();
    const resposta = await request(app).get('/api/openapi.json');
    expect(resposta.body.openapi).toBe('3.0.3');
    expect(Object.keys(resposta.body.paths)).toContain('/api/organizacao/indicadores');
  });

  it('limita as tentativas de login', async () => {
    const { app } = await montar();
    let ultima = 0;
    for (let i = 0; i < 21; i++)
      ultima = (await request(app).post('/api/auth/login').send({ usuario: 'x@x.com', senha: 'errada123' })).status;
    expect(ultima).toBe(429);
  });
});

describe('consulta de CNPJ (ReceitaWS simulada)', () => {
  const resposta = (corpo: unknown, status = 200) =>
    Promise.resolve(new Response(JSON.stringify(corpo), { status }));

  it('preenche razão social, nome fantasia e setor e guarda em cache', async () => {
    const chamadas: string[] = [];
    const buscar = ((url: string) => {
      chamadas.push(url);
      return resposta({
        status: 'OK',
        nome: 'COZINHA BOA ALIMENTOS LTDA',
        fantasia: '',
        situacao: 'ATIVA',
        atividade_principal: [{ code: '56.20-1-01', text: 'Fornecimento de alimentos preparados para empresas' }],
      });
    }) as typeof fetch;
    const { app } = await montar('', buscar);
    const primeira = await request(app).get('/api/cnpj/11.222.333%2F0001-81');
    expect(primeira.body).toEqual({
      cnpj: '11222333000181',
      razaoSocial: 'COZINHA BOA ALIMENTOS LTDA',
      nomeFantasia: 'Cozinha Boa Alimentos Ltda',
      setor: 'Fornecimento de alimentos preparados para empresas',
      situacao: 'ATIVA',
    });
    await request(app).get('/api/cnpj/11222333000181');
    expect(chamadas).toEqual(['https://receitaws.com.br/v1/cnpj/11222333000181']);
  });

  it('trata CNPJ inválido, não encontrado e serviço fora do ar', async () => {
    const naoEncontrado = (() => resposta({ status: 'ERROR', message: 'CNPJ inválido' })) as unknown as typeof fetch;
    const foraDoAr = (() => resposta({}, 429)) as unknown as typeof fetch;
    const app1 = (await montar('', naoEncontrado)).app;
    expect((await request(app1).get('/api/cnpj/11111111111111')).status).toBe(422);
    expect((await request(app1).get('/api/cnpj/44555666000181')).status).toBe(404);
    const app2 = (await montar('', foraDoAr)).app;
    const erro = await request(app2).get('/api/cnpj/44555666000181');
    expect(erro.status).toBe(503);
    expect(erro.body.erro.codigo).toBe('consulta_indisponivel');
  });
});

describe.each(bancos)('dados de demonstração (%s)', (_nome, url) => {
  it('carrega uma única vez', async () => {
    const { app, servicos, repos } = await montar(url);
    await popularDadosDemo(servicos, repos);
    await popularDadosDemo(servicos, repos);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'organizacao@nutricorp.dev', senha: 'NutriCorp123!' });
    const indicadores = await request(app)
      .get('/api/organizacao/indicadores')
      .set({ Authorization: `Bearer ${login.body.token}` });
    expect(indicadores.body).toMatchObject({ colaboradoresAtivos: 2, taxaAdesao: 100 });
    expect(indicadores.body.refeicoesRegistradas).toBe(8);
    const cozinha = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'cozinha@nutricorp.dev', senha: 'NutriCorp123!' });
    expect(cozinha.body).toMatchObject({ perfil: 'organizacao', papel: 'cozinha' });
    await repos.encerrar?.();
  });
});
