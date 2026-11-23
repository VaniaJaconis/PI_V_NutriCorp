import { z } from './zod.js';
import {
  DataIso,
  EstadoCardapio,
  Horario,
  Id,
  Instante,
  Modo,
  PerfilAlimentar,
  RestricaoAlimentar,
  SituacaoCompatibilidade,
  TipoRefeicao,
  textoObrigatorio,
  textoOpcional,
} from './comum.js';

const MSG_PUBLICAR = 'Preencha este campo antes de publicar.';
const MSG_NAO_NEGATIVO = 'Informe um valor igual ou maior que zero.';

const valorNutricional = (unidade: string) =>
  z
    .number({ error: MSG_NAO_NEGATIVO })
    .min(0, { error: MSG_NAO_NEGATIVO })
    .max(100_000, { error: 'Valor muito alto.' })
    .nullable()
    .default(null)
    .meta({ description: `Por porção, em ${unidade}.` });

export const InformacaoNutricional = z
  .object({
    porcaoGramas: z
      .number({ error: 'Informe uma porção maior que zero.' })
      .gt(0, { error: 'Informe uma porção maior que zero.' })
      .max(10_000, { error: 'Valor muito alto.' })
      .nullable()
      .default(null)
      .meta({ example: 450 }),
    energiaKcal: valorNutricional('kcal'),
    carboidratosG: valorNutricional('g'),
    proteinasG: valorNutricional('g'),
    gordurasG: valorNutricional('g'),
    sodioMg: valorNutricional('mg'),
  })
  .meta({ id: 'InformacaoNutricional' });

const camposCardapio = {
  nome: textoObrigatorio(120, 'Informe o nome do cardápio.'),
  data: DataIso.nullable().default(null),
  refeicao: TipoRefeicao.nullable().default(null),
  unidade: textoOpcional(120).default(''),
  inicio: Horario.nullable().default(null),
  fim: Horario.nullable().default(null),
  preparacoes: z
    .array(textoObrigatorio(200))
    .max(30)
    .default([])
    .meta({
      description: 'Uma preparação por item (no formulário: uma por linha).',
      example: ['Arroz integral', 'Feijão', 'Tofu grelhado'],
    }),
  ingredientes: z
    .array(textoObrigatorio(120))
    .max(100)
    .default([])
    .meta({
      description:
        'Um ingrediente por item (no formulário: separados por vírgula ou linha).',
      example: ['Arroz integral', 'Feijão', 'Tofu de soja', 'Azeite', 'Sal'],
    }),
  alergenos: z
    .array(RestricaoAlimentar)
    .default([])
    .meta({ description: 'Alérgenos que o prato contém.' }),
  podeConter: z
    .array(RestricaoAlimentar)
    .default([])
    .meta({ description: 'Alérgenos que podem estar presentes como traços.' }),
  perfisCompativeis: z
    .array(PerfilAlimentar)
    .default([])
    .meta({
      description:
        'Perfis alimentares atendidos (vegetariana, vegana, pescetariana). Lista vazia: atende apenas "sem_preferencia".',
    }),
  revisado: z.boolean().default(false).meta({
    description: 'Confirmação de que ingredientes e alérgenos foram revisados.',
  }),
  nutricional: InformacaoNutricional.default({
    porcaoGramas: null,
    energiaKcal: null,
    carboidratosG: null,
    proteinasG: null,
    gordurasG: null,
    sodioMg: null,
  }),
};

export const EntradaCardapio = z
  .object({ estado: EstadoCardapio, ...camposCardapio })
  .superRefine((dados, ctx) => {
    const erro = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });
    if (dados.inicio && dados.fim && dados.fim <= dados.inicio)
      erro(['fim'], 'O término deve ser posterior ao início.');
    if (dados.estado !== 'publicado') return;
    for (const campo of ['data', 'refeicao', 'inicio', 'fim'] as const)
      if (!dados[campo]) erro([campo], MSG_PUBLICAR);
    if (!dados.unidade) erro(['unidade'], MSG_PUBLICAR);
    if (!dados.preparacoes.length) erro(['preparacoes'], MSG_PUBLICAR);
    if (!dados.ingredientes.length) erro(['ingredientes'], MSG_PUBLICAR);
    for (const [campo, valor] of Object.entries(dados.nutricional))
      if (valor === null) erro(['nutricional', campo], MSG_PUBLICAR);
    if (!dados.revisado)
      erro(
        ['revisado'],
        'Revise e confirme os ingredientes e alérgenos antes de publicar.',
      );
  })
  .meta({
    id: 'EntradaCardapio',
    description:
      'Rascunho exige só o nome. Para publicar, todos os campos, a revisão e a tabela nutricional são obrigatórios.',
  });

export const CardapioOrganizacao = z
  .object({
    id: Id,
    estado: EstadoCardapio,
    nome: z.string(),
    data: DataIso.nullable(),
    refeicao: TipoRefeicao.nullable(),
    unidade: z.string(),
    inicio: Horario.nullable(),
    fim: Horario.nullable(),
    preparacoes: z.array(z.string()),
    ingredientes: z.array(z.string()),
    alergenos: z.array(RestricaoAlimentar),
    podeConter: z.array(RestricaoAlimentar),
    perfisCompativeis: z.array(PerfilAlimentar),
    revisado: z.boolean(),
    nutricional: z.object({
      porcaoGramas: z.number().nullable(),
      energiaKcal: z.number().nullable(),
      carboidratosG: z.number().nullable(),
      proteinasG: z.number().nullable(),
      gordurasG: z.number().nullable(),
      sodioMg: z.number().nullable(),
    }),
    criadoEm: Instante,
    atualizadoEm: Instante,
    publicadoEm: Instante.nullable(),
  })
  .meta({ id: 'CardapioOrganizacao' });

export const Nutriente = z
  .object({
    nome: z.string().meta({ example: 'Valor energético' }),
    quantidade: z.number().meta({ example: 580 }),
    unidade: z.enum(['kcal', 'g', 'mg']),
  })
  .meta({ id: 'Nutriente' });

export const Prato = z
  .object({
    id: Id,
    nome: z.string(),
    ingredientes: z.array(z.string()),
    ingredientesCompletos: z.boolean(),
    contem: z.array(RestricaoAlimentar),
    podeConter: z.array(RestricaoAlimentar),
    alergenicosInformados: z.boolean(),
    perfisCompativeis: z.array(PerfilAlimentar),
    nutricional: z
      .object({ porcaoGramas: z.number(), nutrientes: z.array(Nutriente) })
      .nullable(),
  })
  .meta({ id: 'Prato', description: 'Mesmo formato de types/cardapio.ts do frontend.' });

export const AvaliacaoCompatibilidade = z
  .object({
    pratoId: Id,
    situacao: SituacaoCompatibilidade,
    alertas: z.array(z.string()).meta({
      example: ['Contém lactose.', 'Pode conter traços de soja.'],
    }),
    incompleto: z.boolean().meta({
      description: 'Ingredientes ou alérgenos não confirmados pela organização.',
    }),
  })
  .meta({ id: 'AvaliacaoCompatibilidade' });

export const Refeicao = z
  .object({
    id: Id,
    titulo: z.string().meta({ example: 'Almoço vegetariano' }),
    data: DataIso.nullable(),
    tipo: TipoRefeicao.nullable(),
    unidade: z.string(),
    inicio: Horario.nullable(),
    fim: Horario.nullable(),
    estado: EstadoCardapio,
    pratos: z.array(Prato),
    avaliacoes: z.array(AvaliacaoCompatibilidade).optional().meta({
      description:
        'Só para o colaborador: compatibilidade de cada prato com as preferências dele.',
    }),
  })
  .meta({
    id: 'Refeicao',
    description:
      'Visão de consulta de um cardápio (mesmo formato de types/cardapio.ts do frontend, com campos extras).',
  });

export const FiltroCardapios = z.object({
  data: DataIso.optional(),
  refeicao: TipoRefeicao.optional(),
  estado: EstadoCardapio.optional().meta({
    description: 'Só para a organização. O colaborador sempre vê só os publicados.',
  }),
});

export const CompatibilidadeRefeicao = z
  .object({
    refeicao: Refeicao,
    data: DataIso.nullable(),
    avaliacoes: z.array(AvaliacaoCompatibilidade),
    alternativas: z
      .array(
        z.object({
          refeicaoId: Id,
          prato: Prato,
          avaliacao: AvaliacaoCompatibilidade,
        }),
      )
      .meta({
        description:
          'Outros cardápios publicados no mesmo dia e tipo de refeição, compatíveis com o perfil do colaborador.',
      }),
    alternativaSelecionada: Id.nullable(),
  })
  .meta({ id: 'CompatibilidadeRefeicao' });

export const EntradaSelecaoAlternativa = z
  .object({
    alternativaId: textoObrigatorio(100, 'Selecione uma alternativa.'),
  })
  .meta({ id: 'EntradaSelecaoAlternativa' });

export const ResultadoSelecaoAlternativa = z
  .object({ alternativaSelecionada: Id, modo: Modo })
  .meta({ id: 'ResultadoSelecaoAlternativa' });

export type EntradaCardapioDto = z.infer<typeof EntradaCardapio>;
export type CardapioOrganizacaoDto = z.infer<typeof CardapioOrganizacao>;
export type PratoDto = z.infer<typeof Prato>;
export type RefeicaoDto = z.infer<typeof Refeicao>;
export type AvaliacaoDto = z.infer<typeof AvaliacaoCompatibilidade>;
export type FiltroCardapiosDto = z.infer<typeof FiltroCardapios>;
export type CompatibilidadeRefeicaoDto = z.infer<typeof CompatibilidadeRefeicao>;
