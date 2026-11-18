export interface CredenciaisLogin {
  usuario: string;
  senha: string;
}
export interface ResultadoLogin {
  id: string;
  nome: string;
  perfil: 'colaborador' | 'organizacao';
  modo: 'simulado' | 'api';
}
