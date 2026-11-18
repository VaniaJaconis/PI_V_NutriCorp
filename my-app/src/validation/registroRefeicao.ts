import type { EntradaRegistro } from '../types/registroRefeicao';
export function hojeSaoPaulo() {
  const partes = new Intl.DateTimeFormat('en-US', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const obter = (tipo: string) => partes.find(item => item.type === tipo)!.value;
  return `${obter('year')}-${obter('month')}-${obter('day')}`;
}
export type ErrosRegistro = Partial<Record<'data'|'tipo'|'opcaoId'|'observacoes',string>>;
export function validarRegistro(dados: EntradaRegistro): ErrosRegistro {
  const erros: ErrosRegistro = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.data) || !Number.isFinite(Date.parse(dados.data)) || new Date(dados.data).toISOString().slice(0,10) !== dados.data)
    erros.data = 'Informe uma data válida.';
  else if (dados.data > hojeSaoPaulo()) erros.data = 'A data de consumo não pode estar no futuro.';
  if (!['Café da manhã','Almoço','Lanche','Jantar'].includes(dados.tipo)) erros.tipo = 'Selecione o tipo de refeição.';
  if (!dados.opcaoId) erros.opcaoId = 'Selecione a refeição consumida.';
  if (dados.observacoes.length > 500) erros.observacoes = 'Use até 500 caracteres.';
  return erros;
}
