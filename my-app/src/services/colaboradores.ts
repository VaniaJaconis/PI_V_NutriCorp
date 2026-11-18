import type { CadastroResultado, NovoColaborador } from '../types/colaborador';

export async function cadastrarColaborador(
  _dados: NovoColaborador,
): Promise<CadastroResultado> {

  await new Promise<void>((resolve) => window.setTimeout(resolve, 800));
  return { id: crypto.randomUUID(), modo: 'simulado' };
}
