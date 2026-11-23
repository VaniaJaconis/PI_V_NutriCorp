import type {
  EntradaRegistro,
  OpcaoRegistro,
  RegistroRefeicao,
} from '../types/registroRefeicao';
import { chamarApi } from './api';

export function consultarOpcoesRegistro(data: string, sinal: AbortSignal): Promise<OpcaoRegistro[]> {
  return chamarApi(`/colaborador/registros/opcoes?data=${encodeURIComponent(data)}`, { sinal });
}

export function consultarHistoricoRefeicoes(sinal: AbortSignal): Promise<RegistroRefeicao[]> {
  return chamarApi('/colaborador/registros', { sinal });
}

export function registrarRefeicao(dados: EntradaRegistro): Promise<RegistroRefeicao> {
  return chamarApi('/colaborador/registros', { metodo: 'POST', corpo: dados });
}
