import {
  MAX_DIAS_INDICADORES,
  type ColaboradorResumoDto,
  type FiltroIndicadoresDto,
  type IndicadoresDto,
} from '../contratos/organizacao.js';
import type { Colaborador } from '../dominio/entidades.js';
import { erros } from '../erros.js';
import type { Repositorios } from '../repositorios/tipos.js';
import { contarDias, diaSemanaCurto, diasNoIntervalo, hoje, somarDias } from '../util/datas.js';

const percentual = (parte: number, total: number) =>
  total ? Math.round((parte / total) * 100) : 0;

function distribuir(valores: number[]): number[] {
  const total = valores.reduce((soma, v) => soma + v, 0);
  if (!total) return valores.map(() => 0);
  const brutos = valores.map((v) => (v / total) * 100);
  const inteiros = brutos.map(Math.floor);
  let falta = 100 - inteiros.reduce((soma, v) => soma + v, 0);
  const ordem = brutos
    .map((v, i) => ({ i, resto: v - Math.floor(v) }))
    .sort((a, b) => b.resto - a.resto);
  for (const { i } of ordem) {
    if (falta-- <= 0) break;
    inteiros[i]! += 1;
  }
  return inteiros;
}

function resumo(colaborador: Colaborador): ColaboradorResumoDto {
  const { id, nomeCompleto, emailCorporativo, setor, codigoFuncionario, ativo, criadoEm } =
    colaborador;
  return { id, nomeCompleto, emailCorporativo, setor, codigoFuncionario, ativo, criadoEm };
}

export function criarServicoOrganizacao(repos: Repositorios) {
  return {
    async consolidarIndicadores(
      organizacaoId: string,
      filtro: FiltroIndicadoresDto,
    ): Promise<IndicadoresDto> {
      const fim = filtro.fim ?? (filtro.inicio ? somarDias(filtro.inicio, 6) : hoje());
      const inicio = filtro.inicio ?? somarDias(fim, -6);
      if (contarDias(inicio, fim) > MAX_DIAS_INDICADORES)
        throw erros.validacao({
          inicio: `Consulte no máximo ${MAX_DIAS_INDICADORES} dias.`,
        });
      const dias = diasNoIntervalo(inicio, fim);

      const [colaboradores, registros, publicados] = await Promise.all([
        repos.colaboradores.listarPorOrganizacao(organizacaoId),
        repos.registros.listarPorOrganizacao(organizacaoId, inicio, fim),
        repos.cardapios.listar({
          organizacaoId,
          estado: 'publicado',
          dataInicio: inicio,
          dataFim: fim,
        }),
      ]);
      const ativos = new Set(colaboradores.filter((c) => c.ativo).map((c) => c.id));
      const aderentes = new Set(
        registros.filter((r) => ativos.has(r.colaboradorId)).map((r) => r.colaboradorId),
      );

      const porDia = new Map(dias.map((dia) => [dia, 0]));
      for (const r of registros) porDia.set(r.data, (porDia.get(r.data) ?? 0) + 1);
      const maior = Math.max(0, ...porDia.values());

      const [compativeis, parciais, incompativeis] = distribuir([
        registros.filter((r) => r.situacao === 'compativel').length,
        registros.filter((r) => r.situacao === 'parcial').length,
        registros.filter((r) => r.situacao === 'incompativel').length,
      ]);

      return {
        periodo: { inicio, fim },
        colaboradoresAtivos: ativos.size,
        refeicoesRegistradas: registros.length,
        taxaAdesao: percentual(aderentes.size, ativos.size),
        cardapiosPublicados: publicados.length,
        registrosPorDia: dias.map((data) => ({
          dia: dias.length <= 7 ? diaSemanaCurto(data) : `${data.slice(8, 10)}/${data.slice(5, 7)}`,
          data,
          valor: porDia.get(data) ?? 0,
          percentual: percentual(porDia.get(data) ?? 0, maior),
        })),
        compatibilidade: {
          compativeis: compativeis!,
          parciais: parciais!,
          incompativeis: incompativeis!,
        },
      };
    },

    async listarColaboradores(organizacaoId: string) {
      return (await repos.colaboradores.listarPorOrganizacao(organizacaoId)).map(resumo);
    },

    async alterarAcesso(organizacaoId: string, colaboradorId: string, ativo: boolean) {
      const colaborador = await repos.colaboradores.buscarPorId(colaboradorId);
      if (!colaborador || colaborador.organizacaoId !== organizacaoId)
        throw erros.naoEncontrado('Colaborador não encontrado.');
      colaborador.ativo = ativo;
      await repos.colaboradores.atualizar(colaborador);
      return resumo(colaborador);
    },
  };
}

export type ServicoOrganizacao = ReturnType<typeof criarServicoOrganizacao>;
