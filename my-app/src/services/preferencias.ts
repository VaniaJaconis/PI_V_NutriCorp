import type { PreferenciasColaborador } from '../types/preferencias';
import { chamarApi } from './api';

export function consultarPreferencias(): Promise<PreferenciasColaborador> {
  return chamarApi('/colaborador/preferencias');
}

export function salvarPreferencias(
  dados: PreferenciasColaborador,
): Promise<{ modo: 'api'; preferencias: PreferenciasColaborador }> {
  return chamarApi('/colaborador/preferencias', { metodo: 'PUT', corpo: dados });
}
