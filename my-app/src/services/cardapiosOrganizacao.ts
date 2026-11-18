import type {
  EstadoCardapio,
  FormularioCardapio,
  RegistroCardapio,
} from '../types/cardapioOrganizacao';
import { validarCardapio } from '../validation/cardapioOrganizacao';
let registro: RegistroCardapio | null = null;
export function limparCardapioOrganizacaoSimulado() {
  registro = null;
}
// Integrar a consulta do cardápio da organização com o backend aqui.
export async function consultarCardapioOrganizacao(): Promise<RegistroCardapio | null> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 300));
  return structuredClone(registro);
}
// Integrar o rascunho e a publicação com o backend aqui. Converter os campos numéricos conforme o contrato da API.
export async function salvarCardapioOrganizacao(
  dados: FormularioCardapio,
  estado: EstadoCardapio,
): Promise<RegistroCardapio> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 650));
  if (Object.keys(validarCardapio(dados, estado)).length)
    throw new Error('Cardápio inválido.');
  registro = {
    id: registro?.id ?? crypto.randomUUID(),
    dados: structuredClone(dados),
    estado,
    modo: 'simulado',
  };
  return structuredClone(registro);
}
