import type { PreferenciasColaborador } from '../types/preferencias';

const iniciais = (): PreferenciasColaborador => ({
  perfil: 'sem_preferencia', alimentosEvitar: '', restricoes: [], outrasOrientacoes: '',
});
// Mock em memória: mantém os dados ao navegar, mas não após recarregar a página.
// INTEGRAÇÃO: substituir leitura e gravação por operações autenticadas da API.
// O servidor deve identificar o colaborador pela sessão, validar o contrato e
// retornar apenas os dados autorizados. Não usar localStorage para estes dados.
let salvas = iniciais();
const copiar = (dados: PreferenciasColaborador): PreferenciasColaborador => ({
  ...dados, restricoes: [...dados.restricoes],
});

export function limparPreferenciasSimuladas() { salvas = iniciais(); }

export async function consultarPreferencias(): Promise<PreferenciasColaborador> {
  await new Promise<void>(resolve => window.setTimeout(resolve, 350));
  return copiar(salvas);
}

export async function salvarPreferencias(dados: PreferenciasColaborador): Promise<{ modo: 'simulado' | 'api' }> {
  await new Promise<void>(resolve => window.setTimeout(resolve, 650));
  salvas = copiar(dados);
  return { modo: 'simulado' };
}
