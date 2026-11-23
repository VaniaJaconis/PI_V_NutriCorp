import type { PreferenciasColaborador } from '../types/preferencias';
import { chamarApi } from './api';

export function consultarPreferencias(): Promise<PreferenciasColaborador> {
  return chamarApi('/colaborador/preferencias');
}

export function salvarPreferencias(
  dados: PreferenciasColaborador & { consentimento: boolean },
): Promise<{ modo: 'api'; preferencias: PreferenciasColaborador }> {
  return chamarApi('/colaborador/preferencias', { metodo: 'PUT', corpo: dados });
}

export function excluirPreferencias(): Promise<PreferenciasColaborador> {
  return chamarApi('/colaborador/preferencias', { metodo: 'DELETE' });
}
