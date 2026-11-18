import type { Refeicao } from '../types/cardapio';
import { cardapiosExemplo } from '../mocks/cardapios';

// Integrar a consulta dos cardápios com o backend aqui.
export async function consultarCardapios(): Promise<Refeicao[]> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 450));
  return structuredClone(cardapiosExemplo);
}
