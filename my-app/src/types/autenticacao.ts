export interface CredenciaisLogin {
  usuario: string;
  senha: string;
}
export interface SessaoUsuario {
  id: string;
  nome: string;
  perfil: 'colaborador' | 'organizacao';
  papel?: 'rh' | 'cozinha';
  membro?: boolean;
  organizacao: { id: string; nome: string };
}
export interface ResultadoLogin extends SessaoUsuario {
  token: string;
  expiraEm: string;
  modo: 'api';
}
