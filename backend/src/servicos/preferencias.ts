import type {
  EntradaPreferenciasDto,
  PreferenciasDto,
} from '../contratos/preferencias.js';
import { RESTRICOES_ALIMENTARES } from '../dominio/valores.js';
import type { Repositorios } from '../repositorios/tipos.js';
import { PREFERENCIAS_PADRAO } from './compatibilidade.js';

export function criarServicoPreferencias(repos: Repositorios) {
  return {
    async consultar(colaboradorId: string): Promise<PreferenciasDto> {
      const salvas = await repos.preferencias.buscar(colaboradorId);
      if (!salvas)
        return { ...PREFERENCIAS_PADRAO, outrasOrientacoes: '', atualizadoEm: null };
      const { colaboradorId: _, ...dados } = salvas;
      return dados;
    },

    async salvar(colaboradorId: string, dados: EntradaPreferenciasDto) {
      const preferencias = {
        colaboradorId,
        perfil: dados.perfil,
        alimentosEvitar: dados.alimentosEvitar,
        restricoes: RESTRICOES_ALIMENTARES.filter((r) => dados.restricoes.includes(r)),
        outrasOrientacoes: dados.outrasOrientacoes,
        atualizadoEm: new Date().toISOString(),
      };
      await repos.preferencias.salvar(preferencias);
      const { colaboradorId: _, ...resposta } = preferencias;
      return { modo: 'api' as const, preferencias: resposta };
    },
  };
}

export type ServicoPreferencias = ReturnType<typeof criarServicoPreferencias>;
