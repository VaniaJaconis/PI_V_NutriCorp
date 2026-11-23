import { z } from './zod.js';
import {
  DataIso,
  Id,
  Instante,
  SituacaoCompatibilidade,
  TipoRefeicao,
  textoObrigatorio,
  textoOpcional,
} from './comum.js';
import { AvaliacaoCompatibilidade, Prato } from './cardapios.js';
import { hoje } from '../util/datas.js';

export const FiltroOpcoesRegistro = z.object({
  data: DataIso.optional().meta({ description: 'Padrão: hoje (America/Sao_Paulo).' }),
});

export const OpcaoRegistro = z
  .object({
    id: Id.meta({ description: 'Id do cardápio. Enviar como "opcaoId".' }),
    tipo: TipoRefeicao,
    data: DataIso,
    prato: Prato,
    avaliacao: AvaliacaoCompatibilidade,
  })
  .meta({ id: 'OpcaoRegistro' });

export const EntradaRegistro = z
  .object({
    data: DataIso.refine((data) => data <= hoje(), {
      error: 'A data de consumo não pode estar no futuro.',
    }),
    tipo: z.enum(TipoRefeicao.options, { error: 'Selecione o tipo de refeição.' }),
    opcaoId: textoObrigatorio(100, 'Selecione a refeição consumida.'),
    observacoes: textoOpcional(500).default(''),
    requisicaoId: textoObrigatorio(100).meta({
      description:
        'Gerado pelo cliente (ex.: crypto.randomUUID()) a cada novo registro. Reenviar o mesmo valor não duplica o registro.',
      example: '5d1c8b8e-2a7f-4c1e-9b0e-0c9a7c2f9e11',
    }),
  })
  .meta({ id: 'EntradaRegistro' });

export const RegistroRefeicao = z
  .object({
    id: Id,
    data: DataIso,
    registradoEm: Instante,
    tipo: TipoRefeicao,
    nomeRefeicao: z.string(),
    energia: z.number().nullable().meta({ description: 'kcal por porção.' }),
    observacoes: z.string(),
    situacao: SituacaoCompatibilidade,
  })
  .meta({ id: 'RegistroRefeicao' });

export const EntradaAtualizacaoRegistro = z
  .object({ observacoes: textoOpcional(500).default('') })
  .meta({ id: 'EntradaAtualizacaoRegistro' });

export type EntradaRegistroDto = z.infer<typeof EntradaRegistro>;
export type RegistroRefeicaoDto = z.infer<typeof RegistroRefeicao>;
export type OpcaoRegistroDto = z.infer<typeof OpcaoRegistro>;
