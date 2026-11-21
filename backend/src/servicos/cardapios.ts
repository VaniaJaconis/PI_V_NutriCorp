import { randomUUID } from 'node:crypto';
import type {
  CardapioOrganizacaoDto,
  CompatibilidadeRefeicaoDto,
  EntradaCardapioDto,
  FiltroCardapiosDto,
  PratoDto,
  RefeicaoDto,
} from '../contratos/cardapios.js';
import type { SessaoDto } from '../contratos/contas.js';
import type { Cardapio } from '../dominio/entidades.js';
import { erros } from '../erros.js';
import type { Repositorios } from '../repositorios/tipos.js';
import { avaliarPrato } from './compatibilidade.js';

const semRepetidos = <T>(lista: T[]) => [...new Set(lista)];

/** O cadastro da organização descreve um prato completo; a consulta usa o formato Refeicao/Prato do frontend. */
export function paraPrato(cardapio: Cardapio): PratoDto {
  const n = cardapio.nutricional;
  const nutrientes = (
    [
      ['Valor energético', n.energiaKcal, 'kcal'],
      ['Carboidratos', n.carboidratosG, 'g'],
      ['Proteínas', n.proteinasG, 'g'],
      ['Gorduras totais', n.gordurasG, 'g'],
      ['Sódio', n.sodioMg, 'mg'],
    ] as const
  )
    .filter(([, quantidade]) => quantidade !== null)
    .map(([nome, quantidade, unidade]) => ({
      nome,
      quantidade: quantidade!,
      unidade,
    }));
  return {
    id: cardapio.id,
    nome: cardapio.preparacoes.length ? cardapio.preparacoes.join(', ') : cardapio.nome,
    ingredientes: cardapio.ingredientes,
    ingredientesCompletos: cardapio.revisado && cardapio.ingredientes.length > 0,
    contem: cardapio.alergenos,
    podeConter: cardapio.podeConter,
    alergenicosInformados: cardapio.revisado,
    perfisCompativeis: cardapio.perfisCompativeis,
    nutricional:
      n.porcaoGramas !== null && nutrientes.length
        ? { porcaoGramas: n.porcaoGramas, nutrientes }
        : null,
  };
}

export function paraRefeicao(cardapio: Cardapio): RefeicaoDto {
  return {
    id: cardapio.id,
    titulo: cardapio.nome,
    data: cardapio.data,
    tipo: cardapio.refeicao,
    unidade: cardapio.unidade,
    inicio: cardapio.inicio,
    fim: cardapio.fim,
    estado: cardapio.estado,
    pratos: [paraPrato(cardapio)],
  };
}

function paraCardapioOrganizacao(cardapio: Cardapio): CardapioOrganizacaoDto {
  const { organizacaoId: _, ...dados } = cardapio;
  return dados;
}

export function criarServicoCardapios(repos: Repositorios) {
  async function daOrganizacao(organizacaoId: string, id: string) {
    const cardapio = await repos.cardapios.buscarPorId(id);
    if (!cardapio || cardapio.organizacaoId !== organizacaoId)
      throw erros.naoEncontrado('Cardápio não encontrado.');
    return cardapio;
  }

  /** O colaborador só enxerga cardápios publicados da própria organização. */
  async function visivel(sessao: SessaoDto, id: string) {
    const cardapio = await daOrganizacao(sessao.organizacao.id, id);
    if (sessao.perfil === 'colaborador' && cardapio.estado !== 'publicado')
      throw erros.naoEncontrado('Cardápio não encontrado.');
    return cardapio;
  }

  function montar(
    organizacaoId: string,
    dados: EntradaCardapioDto,
    anterior?: Cardapio,
  ): Cardapio {
    const agora = new Date().toISOString();
    return {
      ...dados,
      id: anterior?.id ?? randomUUID(),
      organizacaoId,
      alergenos: semRepetidos(dados.alergenos),
      podeConter: semRepetidos(dados.podeConter).filter(
        (r) => !dados.alergenos.includes(r),
      ),
      perfisCompativeis: semRepetidos(dados.perfisCompativeis).filter(
        (p) => p !== 'sem_preferencia',
      ),
      criadoEm: anterior?.criadoEm ?? agora,
      atualizadoEm: agora,
      publicadoEm:
        dados.estado === 'publicado' ? (anterior?.publicadoEm ?? agora) : null,
    };
  }

  async function compatibilidade(
    sessao: SessaoDto,
    id: string,
  ): Promise<CompatibilidadeRefeicaoDto & { candidatas: Cardapio[] }> {
    const cardapio = await visivel(sessao, id);
    const preferencias = await repos.preferencias.buscar(sessao.id);
    const refeicao = paraRefeicao(cardapio);
    const avaliacoes = refeicao.pratos.map((p) => avaliarPrato(p, preferencias ?? undefined));
    const candidatas =
      cardapio.data && cardapio.refeicao
        ? (
            await repos.cardapios.listar({
              organizacaoId: sessao.organizacao.id,
              estado: 'publicado',
              data: cardapio.data,
              refeicao: cardapio.refeicao,
            })
          ).filter((c) => c.id !== cardapio.id)
        : [];
    const alternativas = candidatas
      .map((c) => {
        const prato = paraPrato(c);
        return { refeicaoId: c.id, prato, avaliacao: avaliarPrato(prato, preferencias ?? undefined) };
      })
      .filter((a) => a.avaliacao.situacao === 'compativel');
    const selecao = await repos.selecoes.buscar(sessao.id, cardapio.id);
    return {
      refeicao: { ...refeicao, avaliacoes },
      data: cardapio.data,
      avaliacoes,
      alternativas,
      alternativaSelecionada:
        selecao && alternativas.some((a) => a.refeicaoId === selecao.alternativaId)
          ? selecao.alternativaId
          : null,
      candidatas,
    };
  }

  return {
    async listarDaOrganizacao(organizacaoId: string, filtro: FiltroCardapiosDto) {
      const lista = await repos.cardapios.listar({ organizacaoId, ...filtro });
      return lista.map(paraCardapioOrganizacao);
    },

    async obterDaOrganizacao(organizacaoId: string, id: string) {
      return paraCardapioOrganizacao(await daOrganizacao(organizacaoId, id));
    },

    async criar(organizacaoId: string, dados: EntradaCardapioDto) {
      const cardapio = montar(organizacaoId, dados);
      await repos.cardapios.criar(cardapio);
      return paraCardapioOrganizacao(cardapio);
    },

    async atualizar(organizacaoId: string, id: string, dados: EntradaCardapioDto) {
      const cardapio = montar(organizacaoId, dados, await daOrganizacao(organizacaoId, id));
      await repos.cardapios.atualizar(cardapio);
      return paraCardapioOrganizacao(cardapio);
    },

    async remover(organizacaoId: string, id: string) {
      await daOrganizacao(organizacaoId, id);
      await repos.cardapios.remover(id);
    },

    async listarRefeicoes(sessao: SessaoDto, filtro: FiltroCardapiosDto) {
      const colaborador = sessao.perfil === 'colaborador';
      const lista = await repos.cardapios.listar({
        organizacaoId: sessao.organizacao.id,
        data: filtro.data,
        refeicao: filtro.refeicao,
        estado: colaborador ? 'publicado' : filtro.estado,
      });
      if (!colaborador) return lista.map(paraRefeicao);
      const preferencias = (await repos.preferencias.buscar(sessao.id)) ?? undefined;
      return lista.map((cardapio) => {
        const refeicao = paraRefeicao(cardapio);
        return {
          ...refeicao,
          avaliacoes: refeicao.pratos.map((p) => avaliarPrato(p, preferencias)),
        };
      });
    },

    async obterRefeicao(sessao: SessaoDto, id: string) {
      return paraRefeicao(await visivel(sessao, id));
    },

    async consultarCompatibilidade(sessao: SessaoDto, id: string) {
      const { candidatas: _, ...resultado } = await compatibilidade(sessao, id);
      return resultado;
    },

    async selecionarAlternativa(sessao: SessaoDto, id: string, alternativaId: string) {
      const { alternativas, candidatas } = await compatibilidade(sessao, id);
      if (!alternativas.some((a) => a.refeicaoId === alternativaId)) {
        if (candidatas.some((c) => c.id === alternativaId))
          throw erros.validacao(
            { alternativaId: 'Alternativa incompatível com o perfil atual.' },
            'Alternativa incompatível com o perfil atual.',
          );
        throw erros.naoEncontrado('Alternativa indisponível.');
      }
      await repos.selecoes.salvar({
        colaboradorId: sessao.id,
        cardapioId: id,
        alternativaId,
        selecionadoEm: new Date().toISOString(),
      });
      return { alternativaSelecionada: alternativaId, modo: 'api' as const };
    },
  };
}

export type ServicoCardapios = ReturnType<typeof criarServicoCardapios>;
