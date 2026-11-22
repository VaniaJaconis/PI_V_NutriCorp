export const perfisAcesso = [
  'Funcionário',
  'Nutricionista',
  'Administração',
  'Sem acesso',
] as const;

export type PerfilAcesso = (typeof perfisAcesso)[number];

export interface ColaboradorAcesso {
  id: string;
  nome: string;
  setor: string;
  acesso: PerfilAcesso;
  codigoFuncionario: string;
}

export interface ResultadoAtualizacaoAcesso {
  colaborador: ColaboradorAcesso;
  modo: 'simulado' | 'api';
}
