import type {
  NovaOrganizacao,
  ResultadoCadastroOrganizacao,
} from '../types/organizacao';

// Integrar o cadastro da organização com o backend aqui.
export async function cadastrarOrganizacao(
  _dados: NovaOrganizacao,
): Promise<ResultadoCadastroOrganizacao> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 800));
  return { id: crypto.randomUUID(), modo: 'simulado' };
}
