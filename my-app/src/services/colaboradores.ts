import type { ResultadoLogin } from '../types/autenticacao';
import type { NovoColaborador } from '../types/colaborador';
import { chamarApi } from './api';

export function cadastrarColaborador(dados: NovoColaborador): Promise<ResultadoLogin> {
  return chamarApi('/colaboradores', { metodo: 'POST', corpo: dados, publica: true });
}
