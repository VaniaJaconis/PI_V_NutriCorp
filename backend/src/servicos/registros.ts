import { randomUUID } from 'node:crypto';
import type { SessaoDto } from '../contratos/contas.js';
import type {
  EntradaRegistroDto,
  OpcaoRegistroDto,
  RegistroRefeicaoDto,
} from '../contratos/registros.js';
import type { RegistroRefeicao } from '../dominio/entidades.js';
import { erros } from '../erros.js';
import type { Repositorios } from '../repositorios/tipos.js';
import { hoje } from '../util/datas.js';
import { paraPrato } from './cardapios.js';
import { avaliarPrato } from './compatibilidade.js';

function paraDto(registro: RegistroRefeicao): RegistroRefeicaoDto {
  const { id, data, registradoEm, tipo, nomeRefeicao, energia, observacoes, situacao } =
    registro;
  return { id, data, registradoEm, tipo, nomeRefeicao, energia, observacoes, situacao };
}

export function criarServicoRegistros(repos: Repositorios) {
  // Evita duplicidade quando o mesmo envio chega duas vezes ao mesmo tempo.
  // No PostgreSQL, a garantia final é a chave única (colaborador_id, requisicao_id).
  const emAndamento = new Map<string, Promise<{ registro: RegistroRefeicaoDto; criado: boolean }>>();

  async function registrar(sessao: SessaoDto, dados: EntradaRegistroDto) {
    const anterior = await repos.registros.buscarPorRequisicao(sessao.id, dados.requisicaoId);
    if (anterior) return { registro: paraDto(anterior), criado: false };

    const cardapio = await repos.cardapios.buscarPorId(dados.opcaoId);
    if (
      !cardapio ||
      cardapio.organizacaoId !== sessao.organizacao.id ||
      cardapio.estado !== 'publicado' ||
      cardapio.data !== dados.data ||
      cardapio.refeicao !== dados.tipo
    )
      throw erros.validacao({
        opcaoId: 'Refeição indisponível para a data e o tipo informados.',
      });

    const prato = paraPrato(cardapio);
    const preferencias = (await repos.preferencias.buscar(sessao.id)) ?? undefined;
    const registro: RegistroRefeicao = {
      id: randomUUID(),
      colaboradorId: sessao.id,
      organizacaoId: sessao.organizacao.id,
      cardapioId: cardapio.id,
      requisicaoId: dados.requisicaoId,
      data: dados.data,
      tipo: dados.tipo,
      nomeRefeicao: prato.nome,
      energia: cardapio.nutricional.energiaKcal,
      observacoes: dados.observacoes,
      situacao: avaliarPrato(prato, preferencias).situacao,
      registradoEm: new Date().toISOString(),
    };
    await repos.registros.criar(registro);
    return { registro: paraDto(registro), criado: true };
  }

  return {
    async listarOpcoes(sessao: SessaoDto, data = hoje()): Promise<OpcaoRegistroDto[]> {
      const [cardapios, preferencias] = await Promise.all([
        repos.cardapios.listar({
          organizacaoId: sessao.organizacao.id,
          estado: 'publicado',
          data,
        }),
        repos.preferencias.buscar(sessao.id),
      ]);
      return cardapios.flatMap((cardapio) => {
        if (!cardapio.refeicao || !cardapio.data) return [];
        const prato = paraPrato(cardapio);
        return [
          {
            id: cardapio.id,
            tipo: cardapio.refeicao,
            data: cardapio.data,
            prato,
            avaliacao: avaliarPrato(prato, preferencias ?? undefined),
          },
        ];
      });
    },

    async listarHistorico(sessao: SessaoDto) {
      return (await repos.registros.listarPorColaborador(sessao.id)).map(paraDto);
    },

    async registrar(sessao: SessaoDto, dados: EntradaRegistroDto) {
      const chave = `${sessao.id}:${dados.requisicaoId}`;
      const pendente = emAndamento.get(chave);
      if (pendente) return { ...(await pendente), criado: false };
      const tarefa = registrar(sessao, dados);
      emAndamento.set(chave, tarefa);
      try {
        return await tarefa;
      } finally {
        emAndamento.delete(chave);
      }
    },
  };
}

export type ServicoRegistros = ReturnType<typeof criarServicoRegistros>;
