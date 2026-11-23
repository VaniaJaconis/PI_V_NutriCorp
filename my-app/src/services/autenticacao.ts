import type { CredenciaisLogin, ResultadoLogin, SessaoUsuario } from '../types/autenticacao';
import { chamarApi } from './api';

export function entrar(dados: CredenciaisLogin): Promise<ResultadoLogin> {
  return chamarApi('/auth/login', { metodo: 'POST', corpo: dados, publica: true });
}

export function consultarSessao(sinal: AbortSignal): Promise<SessaoUsuario> {
  return chamarApi('/auth/sessao', { sinal });
}

export function alterarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
  return chamarApi('/auth/senha', { metodo: 'PUT', corpo: { senhaAtual, novaSenha } });
}
