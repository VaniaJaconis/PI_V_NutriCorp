export const perfisAcesso = [
  'Funcionário',
  'Sem acesso',
] as const;

export type PerfilAcesso = (typeof perfisAcesso)[number];

export interface ColaboradorAcesso {
  id: string;
  nome: string;
  setor: string;
  acesso: PerfilAcesso | 'Aguardando aprovação';
  codigoFuncionario: string;
}

export interface ResultadoAtualizacaoAcesso {
  colaborador: ColaboradorAcesso;
  modo: 'api';
}
