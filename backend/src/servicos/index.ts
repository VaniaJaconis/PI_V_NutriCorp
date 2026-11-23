import type { Config } from '../config.js';
import type { Repositorios } from '../repositorios/tipos.js';
import { criarServicoCardapios } from './cardapios.js';
import { criarServicoCnpj } from './cnpj.js';
import { criarServicoContas } from './contas.js';
import { criarServicoOrganizacao } from './organizacao.js';
import { criarServicoPreferencias } from './preferencias.js';
import { criarServicoRegistros } from './registros.js';
import { criarServicoTokens } from './tokens.js';

export function criarServicos(repos: Repositorios, config: Config, buscarCnpj: typeof fetch = fetch) {
  const tokens = criarServicoTokens(config);
  return {
    tokens,
    cnpj: criarServicoCnpj(buscarCnpj),
    contas: criarServicoContas(repos, tokens),
    preferencias: criarServicoPreferencias(repos),
    cardapios: criarServicoCardapios(repos),
    registros: criarServicoRegistros(repos),
    organizacao: criarServicoOrganizacao(repos),
  };
}

export type Servicos = ReturnType<typeof criarServicos>;
