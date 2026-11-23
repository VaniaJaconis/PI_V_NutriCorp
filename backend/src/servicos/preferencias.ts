import type {
  EntradaPreferenciasDto,
  PreferenciasDto,
} from '../contratos/preferencias.js';
import { RESTRICOES_ALIMENTARES } from '../dominio/valores.js';
import type { Repositorios } from '../repositorios/tipos.js';
import { PREFERENCIAS_PADRAO } from './compatibilidade.js';

const vazias = (): PreferenciasDto => ({
  ...PREFERENCIAS_PADRAO,
  outrasOrientacoes: '',
  consentimentoEm: null,
  atualizadoEm: null,
});

export function criarServicoPreferencias(repos: Repositorios) {
  return {
    async consultar(colaboradorId: string): Promise<PreferenciasDto> {
      const salvas = await repos.preferencias.buscar(colaboradorId);
      if (!salvas) return vazias();
      const { colaboradorId: _, ...dados } = salvas;
      return dados;
    },

    async salvar(colaboradorId: string, dados: EntradaPreferenciasDto) {
      const agora = new Date().toISOString();
      const preferencias = {
        colaboradorId,
        perfil: dados.perfil,
        alimentosEvitar: dados.alimentosEvitar,
        restricoes: RESTRICOES_ALIMENTARES.filter((r) => dados.restricoes.includes(r)),
        outrasOrientacoes: dados.outrasOrientacoes,
        consentimentoEm: agora,
        atualizadoEm: agora,
      };
      await repos.preferencias.salvar(preferencias);
      const { colaboradorId: _, ...resposta } = preferencias;
      return { modo: 'api' as const, preferencias: resposta };
    },

    async excluir(colaboradorId: string) {
      await repos.preferencias.remover(colaboradorId);
      return vazias();
    },
  };
}

export type ServicoPreferencias = ReturnType<typeof criarServicoPreferencias>;
