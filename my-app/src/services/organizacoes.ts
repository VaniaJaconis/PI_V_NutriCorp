import type { ResultadoLogin } from '../types/autenticacao';
import type { NovaOrganizacao } from '../types/organizacao';
import { chamarApi } from './api';

export function cadastrarOrganizacao(dados: NovaOrganizacao): Promise<ResultadoLogin> {
  return chamarApi('/organizacoes', { metodo: 'POST', corpo: dados, publica: true });
}
