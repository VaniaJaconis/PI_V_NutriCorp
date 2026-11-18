// Contrato provisório: alinhar os nomes e limites com a API do Gabriel.
export interface NovaOrganizacao {
  razaoSocial: string;
  cnpj: string;
  nomeFantasia: string;
  setor: string;
  emailComunicacao: string;
  senha: string;
}
export interface ResultadoCadastroOrganizacao { id: string; modo: 'simulado' | 'api'; }
