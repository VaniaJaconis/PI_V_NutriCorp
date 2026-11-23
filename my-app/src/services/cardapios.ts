import type { Refeicao } from '../types/cardapio';
import { chamarApi } from './api';

export function consultarCardapios(): Promise<Refeicao[]> {
  return chamarApi('/cardapios');
}
