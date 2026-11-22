import type { IndicadoresConsolidados } from '../types/indicadores';
import { chamarApi } from './api';

export function consultarIndicadoresConsolidados(): Promise<IndicadoresConsolidados> {
  return chamarApi('/organizacao/indicadores');
}
