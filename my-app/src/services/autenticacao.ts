import type { CredenciaisLogin, ResultadoLogin } from '../types/autenticacao';

export class CredenciaisInvalidas extends Error {
  constructor() { super('Usuário ou senha inválidos.'); this.name = 'CredenciaisInvalidas'; }
}

export async function entrar(dados: CredenciaisLogin): Promise<ResultadoLogin> {
  // DEMONSTRAÇÃO: contas fictícias, sem acesso a qualquer serviço real.
  // Usuários: colaborador ou organizacao. Senha de teste: NutriCorp123!
  // INTEGRAÇÃO: substituir pela operação de login definida com Gabriel.
  // O servidor valida credenciais e fornece a identidade, o perfil e a sessão.
  // Não registrar senhas nem salvá-las no armazenamento do navegador.
  await new Promise<void>(resolve => window.setTimeout(resolve, 700));
  const usuario = dados.usuario.trim().toLowerCase();
  if (!['colaborador', 'organizacao'].includes(usuario) || dados.senha !== 'NutriCorp123!')
    throw new CredenciaisInvalidas();
  return usuario === 'colaborador'
    ? { id: 'demo-colaborador', nome: 'Colaborador de demonstração', perfil: 'colaborador', modo: 'simulado' }
    : { id: 'demo-organizacao', nome: 'Organização de demonstração', perfil: 'organizacao', modo: 'simulado' };
}
