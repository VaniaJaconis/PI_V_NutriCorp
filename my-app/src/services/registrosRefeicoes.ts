import type { EntradaRegistro, OpcaoRegistro, RegistroRefeicao, TipoRefeicao } from '../types/registroRefeicao';
import { consultarCardapios } from './cardapios';
import { alternativaVegetariana } from '../mocks/almocoVegetariano';
import { validarRegistro } from '../validation/registroRefeicao';

// Histórico fictício para a demonstração. Nenhum registro pertence a pessoas reais.
const exemplos: RegistroRefeicao[] = [
  {id:'ex-1',data:'2026-11-09',registradoEm:'2026-11-09T15:15:00Z',tipo:'Almoço',nomeRefeicao:'Arroz, feijão e tofu',energia:580,observacoes:''},
  {id:'ex-2',data:'2026-11-09',registradoEm:'2026-11-09T19:00:00Z',tipo:'Lanche',nomeRefeicao:'Banana e aveia',energia:210,observacoes:''},
  {id:'ex-3',data:'2026-11-06',registradoEm:'2026-11-06T15:10:00Z',tipo:'Almoço',nomeRefeicao:'Arroz, lentilha e legumes',energia:540,observacoes:''},
];
let historico = structuredClone(exemplos);
const requisicoes = new Map<string, RegistroRefeicao>();
export function limparRegistrosSimulados() { historico = structuredClone(exemplos); requisicoes.clear(); }

export async function consultarOpcoesRegistro(): Promise<OpcaoRegistro[]> {
  // INTEGRAÇÃO: consultar refeições autorizadas/disponíveis para o colaborador.
  const cardapios = await consultarCardapios();
  return [
    {id:'alternativa-tofu',tipo:'Almoço',prato:structuredClone(alternativaVegetariana)},
    ...cardapios.flatMap(refeicao => refeicao.pratos.map(prato => ({
      id:`${refeicao.id}:${prato.id}`,
      tipo: (refeicao.titulo.toLowerCase().includes('lanche') ? 'Lanche' : 'Almoço') as TipoRefeicao,
      prato,
    }))),
  ];
}
export async function consultarHistoricoRefeicoes(): Promise<RegistroRefeicao[]> {
  // INTEGRAÇÃO: buscar somente o histórico do usuário autenticado, com paginação.
  await new Promise<void>(resolve => window.setTimeout(resolve,300));
  return structuredClone(historico);
}
export async function registrarRefeicao(dados: EntradaRegistro): Promise<RegistroRefeicao> {
  // INTEGRAÇÃO: POST autenticado; confirmar idempotência, IDs, erros e validação no servidor.
  // O registro é relato de consumo, sem implicar recomendação ou autorização nutricional.
  await new Promise<void>(resolve => window.setTimeout(resolve,650));
  if (Object.keys(validarRegistro(dados)).length) throw new Error('Registro inválido.');
  const anterior = requisicoes.get(dados.requisicaoId);
  if (anterior) return structuredClone(anterior);
  const opcao = (await consultarOpcoesRegistro()).find(item => item.id === dados.opcaoId && item.tipo === dados.tipo);
  if (!opcao) throw new Error('Refeição indisponível.');
  const registro: RegistroRefeicao = {id:crypto.randomUUID(),data:dados.data,registradoEm:new Date().toISOString(),
    tipo:dados.tipo,nomeRefeicao:opcao.prato.nome,observacoes:dados.observacoes.trim(),
    energia:opcao.prato.nutricional?.nutrientes.find(item => item.unidade === 'kcal')?.quantidade ?? null};
  // Revalidar após a espera para que a mesma chave não crie duplicidade.
  const existente = requisicoes.get(dados.requisicaoId);
  if (existente) return structuredClone(existente);
  requisicoes.set(dados.requisicaoId,registro); historico.unshift(registro);
  return structuredClone(registro);
}
