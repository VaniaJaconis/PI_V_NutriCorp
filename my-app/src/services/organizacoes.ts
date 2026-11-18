import type { NovaOrganizacao, ResultadoCadastroOrganizacao } from '../types/organizacao';

export async function cadastrarOrganizacao(_dados: NovaOrganizacao): Promise<ResultadoCadastroOrganizacao> {
  // INTEGRAÇÃO: substituir por POST no endpoint de cadastro da organização.
  // Confirmar contrato, tratamento de duplicidade e validação no servidor.
  // O CNPJ é enviado sem pontuação, como string (pode incluir letras).
  // Não registrar senha no console nem persistir o formulário no navegador.
  await new Promise<void>(resolve => window.setTimeout(resolve, 800));
  return { id: crypto.randomUUID(), modo: 'simulado' };
}
