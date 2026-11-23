import type { AvaliacaoCompatibilidade, Prato, Refeicao } from '../types/cardapio';
import { chamarApi } from './api';

interface CompatibilidadeRefeicao {
  refeicao: Refeicao;
  data: string | null;
  avaliacoes: AvaliacaoCompatibilidade[];
  alternativas: {
    refeicaoId: string;
    prato: Prato;
    avaliacao: AvaliacaoCompatibilidade;
  }[];
  alternativaSelecionada: string | null;
}

export function consultarAlternativas(refeicaoId: string): Promise<CompatibilidadeRefeicao> {
  return chamarApi(`/colaborador/cardapios/${encodeURIComponent(refeicaoId)}/compatibilidade`);
}

export function selecionarAlternativa(
  refeicaoId: string,
  alternativaId: string,
): Promise<{ alternativaSelecionada: string }> {
  return chamarApi(`/colaborador/cardapios/${encodeURIComponent(refeicaoId)}/alternativa`, {
    metodo: 'PUT',
    corpo: { alternativaId },
  });
}
