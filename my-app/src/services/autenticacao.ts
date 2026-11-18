import type { CredenciaisLogin, ResultadoLogin } from '../types/autenticacao';

export class CredenciaisInvalidas extends Error {
  constructor() {
    super('Usuário ou senha inválidos.');
    this.name = 'CredenciaisInvalidas';
  }
}

// Integrar o login com o backend aqui, recebendo o perfil e a sessão do usuário.
export async function entrar(dados: CredenciaisLogin): Promise<ResultadoLogin> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 700));
  const usuario = dados.usuario.trim().toLowerCase();
  if (
    !['colaborador', 'organizacao'].includes(usuario) ||
    dados.senha !== 'NutriCorp123!'
  )
    throw new CredenciaisInvalidas();
  return usuario === 'colaborador'
    ? {
        id: 'demo-colaborador',
        nome: 'Colaborador',
        perfil: 'colaborador',
        modo: 'simulado',
      }
    : {
        id: 'demo-organizacao',
        nome: 'Organização',
        perfil: 'organizacao',
        modo: 'simulado',
      };
}
