import type { ResultadoLogin } from '../types/autenticacao';
import type { NovaOrganizacao } from '../types/organizacao';
import { chamarApi } from './api';

export function cadastrarOrganizacao(dados: NovaOrganizacao): Promise<ResultadoLogin> {
  return chamarApi('/organizacoes', { metodo: 'POST', corpo: dados, publica: true });
}

export interface DadosCnpj {
  razaoSocial: string;
  nomeFantasia: string;
  setor: string;
  situacao: string;
}

export function consultarCnpj(cnpj: string): Promise<DadosCnpj> {
  return chamarApi(`/cnpj/${encodeURIComponent(cnpj)}`, { publica: true });
}
