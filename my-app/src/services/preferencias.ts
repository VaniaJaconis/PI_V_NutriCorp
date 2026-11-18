import type { PreferenciasColaborador } from '../types/preferencias';

const iniciais = (): PreferenciasColaborador => ({
  perfil: 'sem_preferencia',
  alimentosEvitar: '',
  restricoes: [],
  outrasOrientacoes: '',
});
let salvas = iniciais();
const copiar = (dados: PreferenciasColaborador): PreferenciasColaborador => ({
  ...dados,
  restricoes: [...dados.restricoes],
});

export function limparPreferenciasSimuladas() {
  salvas = iniciais();
}

// Integrar a consulta das preferências do colaborador com o backend aqui.
export async function consultarPreferencias(): Promise<PreferenciasColaborador> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 350));
  return copiar(salvas);
}

// Integrar o salvamento das preferências com o backend aqui.
export async function salvarPreferencias(
  dados: PreferenciasColaborador,
): Promise<{ modo: 'simulado' | 'api' }> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 650));
  salvas = copiar(dados);
  return { modo: 'simulado' };
}
