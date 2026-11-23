export const PERFIS_ACESSO = ['colaborador', 'organizacao'] as const;
export type PerfilAcesso = (typeof PERFIS_ACESSO)[number];

export const PAPEIS_EQUIPE = ['rh', 'cozinha'] as const;
export type PapelEquipe = (typeof PAPEIS_EQUIPE)[number];

export const TIPOS_REFEICAO = [
  'Café da manhã',
  'Almoço',
  'Lanche',
  'Jantar',
] as const;
export type TipoRefeicao = (typeof TIPOS_REFEICAO)[number];

export const PERFIS_ALIMENTARES = [
  'sem_preferencia',
  'vegetariana',
  'vegana',
  'pescetariana',
] as const;
export type PerfilAlimentar = (typeof PERFIS_ALIMENTARES)[number];

export const RESTRICOES_ALIMENTARES = [
  'lactose',
  'gluten',
  'amendoim',
  'castanhas',
  'ovo',
  'soja',
] as const;
export type RestricaoAlimentar = (typeof RESTRICOES_ALIMENTARES)[number];

export const NOMES_RESTRICOES: Record<RestricaoAlimentar, string> = {
  lactose: 'lactose',
  gluten: 'glúten',
  amendoim: 'amendoim',
  castanhas: 'castanhas',
  ovo: 'ovo',
  soja: 'soja',
};

export const ESTADOS_CARDAPIO = ['rascunho', 'publicado'] as const;
export type EstadoCardapio = (typeof ESTADOS_CARDAPIO)[number];

export const SITUACOES_COMPATIBILIDADE = [
  'compativel',
  'parcial',
  'incompativel',
] as const;
export type SituacaoCompatibilidade =
  (typeof SITUACOES_COMPATIBILIDADE)[number];
