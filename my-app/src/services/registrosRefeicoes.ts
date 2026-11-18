import { historicoExemplo } from '../mocks/historicoRefeicoes';
import type {
  EntradaRegistro,
  OpcaoRegistro,
  RegistroRefeicao,
  TipoRefeicao,
} from '../types/registroRefeicao';
import { consultarCardapios } from './cardapios';
import { alternativaVegetariana } from '../mocks/almocoVegetariano';
import { validarRegistro } from '../validation/registroRefeicao';

let historico = structuredClone(historicoExemplo);
const requisicoes = new Map<string, RegistroRefeicao>();
export function limparRegistrosSimulados() {
  historico = structuredClone(historicoExemplo);
  requisicoes.clear();
}

// Integrar a consulta das refeições disponíveis com o backend aqui.
export async function consultarOpcoesRegistro(): Promise<OpcaoRegistro[]> {
  const cardapios = await consultarCardapios();
  return [
    {
      id: 'alternativa-tofu',
      tipo: 'Almoço',
      prato: structuredClone(alternativaVegetariana),
    },
    ...cardapios.flatMap((refeicao) =>
      refeicao.pratos.map((prato) => ({
        id: `${refeicao.id}:${prato.id}`,
        tipo: (refeicao.titulo.toLowerCase().includes('lanche')
          ? 'Lanche'
          : 'Almoço') as TipoRefeicao,
        prato,
      })),
    ),
  ];
}
// Integrar a consulta do histórico do usuário autenticado com o backend aqui.
export async function consultarHistoricoRefeicoes(): Promise<
  RegistroRefeicao[]
> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 300));
  return structuredClone(historico);
}
// Integrar o registro da refeição com o backend aqui, mantendo a prevenção de envios duplicados.
export async function registrarRefeicao(
  dados: EntradaRegistro,
): Promise<RegistroRefeicao> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 650));
  if (Object.keys(validarRegistro(dados)).length)
    throw new Error('Registro inválido.');
  const anterior = requisicoes.get(dados.requisicaoId);
  if (anterior) return structuredClone(anterior);
  const opcao = (await consultarOpcoesRegistro()).find(
    (item) => item.id === dados.opcaoId && item.tipo === dados.tipo,
  );
  if (!opcao) throw new Error('Refeição indisponível.');
  const registro: RegistroRefeicao = {
    id: crypto.randomUUID(),
    data: dados.data,
    registradoEm: new Date().toISOString(),
    tipo: dados.tipo,
    nomeRefeicao: opcao.prato.nome,
    observacoes: dados.observacoes.trim(),
    energia:
      opcao.prato.nutricional?.nutrientes.find(
        (item) => item.unidade === 'kcal',
      )?.quantidade ?? null,
  };
  const existente = requisicoes.get(dados.requisicaoId);
  if (existente) return structuredClone(existente);
  requisicoes.set(dados.requisicaoId, registro);
  historico.unshift(registro);
  return structuredClone(registro);
}
