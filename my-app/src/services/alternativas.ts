import { consultarCardapios } from './cardapios';
import { consultarPreferencias } from './preferencias';
import { alternativaVegetariana } from '../mocks/almocoVegetariano';
import { avaliarCompatibilidade } from '../validation/compatibilidade';

// Seleção provisória em memória. Não é registro de consumo, reserva nem autenticação.
const selecoes = new Map<string, string>();
export function limparSelecoesSimuladas() { selecoes.clear(); }

export async function consultarAlternativas(refeicaoId: string) {
  // INTEGRAÇÃO: obter refeição, alternativas e seleção do colaborador pela API.
  const refeicao = (await consultarCardapios()).find(item => item.id === refeicaoId);
  if (!refeicao) throw new Error('Refeição não encontrada.');
  return {
    refeicao,
    data: refeicaoId === 'terca-vegetariano' ? '2026-11-10' : null,
    alternativa: refeicao.pratos.length ? structuredClone(alternativaVegetariana) : null,
    alternativaSelecionada: selecoes.get(refeicaoId) ?? null,
  };
}
export async function selecionarAlternativa(refeicaoId: string, alternativaId: string) {
  // INTEGRAÇÃO: enviar IDs, tratar duplicidade, indisponibilidade e validação pelo servidor.
  const [detalhes, perfil] = await Promise.all([consultarAlternativas(refeicaoId), consultarPreferencias()]);
  const candidata = detalhes.alternativa;
  if (!candidata || candidata.id !== alternativaId) throw new Error('Alternativa indisponível.');
  const analise = avaliarCompatibilidade(candidata, perfil);
  if (analise.incompleto || analise.alertas.length) throw new Error('Alternativa incompatível com o perfil atual.');
  selecoes.set(refeicaoId, alternativaId);
  return { modo: 'simulado' as const };
}
