import type { EstadoCardapio, FormularioCardapio, RegistroCardapio } from '../types/cardapioOrganizacao';
import { validarCardapio } from '../validation/cardapioOrganizacao';
let registro: RegistroCardapio | null = null;
export function limparCardapioOrganizacaoSimulado() { registro = null; }
export async function consultarCardapioOrganizacao(): Promise<RegistroCardapio | null> {
  // INTEGRAÇÃO: buscar o cardápio/rascunho autorizado da organização pela API.
  await new Promise<void>(resolve => window.setTimeout(resolve, 300));
  return structuredClone(registro);
}
export async function salvarCardapioOrganizacao(dados: FormularioCardapio, estado: EstadoCardapio): Promise<RegistroCardapio> {
  // INTEGRAÇÃO: alinhar endpoint, ID da unidade e publicação transacional com Gabriel.
  // Converter campos numéricos para números, sem confundir ausência com zero.
  // O servidor deverá autorizar a organização e validar novamente todos os dados.
  await new Promise<void>(resolve => window.setTimeout(resolve, 650));
  if (Object.keys(validarCardapio(dados, estado)).length) throw new Error('Cardápio inválido.');
  registro = { id: registro?.id ?? crypto.randomUUID(), dados: structuredClone(dados), estado, modo: 'simulado' };
  return structuredClone(registro);
}
