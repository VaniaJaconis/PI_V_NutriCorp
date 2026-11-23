import type { IndicadoresConsolidados } from '../types/indicadores';
import { hojeSaoPaulo } from '../validation/registroRefeicao';
import { chamarApi } from './api';

function somarDias(data: string, dias: number) {
  const valor = new Date(`${data}T12:00:00Z`);
  valor.setUTCDate(valor.getUTCDate() + dias);
  return valor.toISOString().slice(0, 10);
}

export function consultarIndicadoresConsolidados(dias = 7): Promise<IndicadoresConsolidados> {
  const fim = hojeSaoPaulo();
  return chamarApi(`/organizacao/indicadores?inicio=${somarDias(fim, 1 - dias)}&fim=${fim}`);
}
