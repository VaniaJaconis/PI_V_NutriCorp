import type { Prato } from './cardapio';
export type TipoRefeicao = 'Café da manhã' | 'Almoço' | 'Lanche' | 'Jantar';
export interface OpcaoRegistro { id: string; tipo: TipoRefeicao; prato: Prato; }
export interface EntradaRegistro {
  data: string; tipo: TipoRefeicao; opcaoId: string; observacoes: string; requisicaoId: string;
}
export interface RegistroRefeicao {
  id: string; data: string; registradoEm: string; tipo: TipoRefeicao;
  nomeRefeicao: string; energia: number | null; observacoes: string;
}
