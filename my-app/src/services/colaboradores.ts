import type { NovoColaborador, ResultadoCadastroColaborador } from '../types/colaborador';
import { chamarApi } from './api';

export function cadastrarColaborador(dados: NovoColaborador): Promise<ResultadoCadastroColaborador> {
  return chamarApi('/colaboradores', { metodo: 'POST', corpo: dados, publica: true });
}
