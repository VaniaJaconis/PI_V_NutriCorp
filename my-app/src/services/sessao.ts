import type { ResultadoLogin } from '../types/autenticacao';

const chave = 'nutricorp.sessao';
export const eventoSessaoEncerrada = 'nutricorp:sessao-encerrada';

export function lerSessao(): ResultadoLogin | null {
  try {
    const valor = window.sessionStorage.getItem(chave);
    if (!valor) return null;
    const sessao = JSON.parse(valor) as ResultadoLogin | null;
    if (
      sessao &&
      typeof sessao.token === 'string' &&
      sessao.token &&
      Number.isFinite(Date.parse(sessao.expiraEm)) &&
      (sessao.perfil === 'colaborador' || sessao.perfil === 'organizacao')
    )
      return sessao;
    window.sessionStorage.removeItem(chave);
  } catch {
    return null;
  }
  return null;
}

export function guardarSessao(sessao: ResultadoLogin) {
  window.sessionStorage.setItem(chave, JSON.stringify(sessao));
}

export function encerrarSessao(mensagem = '') {
  window.sessionStorage.removeItem(chave);
  window.dispatchEvent(new CustomEvent(eventoSessaoEncerrada, { detail: mensagem }));
}
