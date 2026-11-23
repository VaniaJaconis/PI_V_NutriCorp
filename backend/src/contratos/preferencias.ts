import { z } from './zod.js';
import {
  Instante,
  Modo,
  PerfilAlimentar,
  RestricaoAlimentar,
  textoOpcional,
} from './comum.js';

export const EntradaPreferencias = z
  .object({
    perfil: PerfilAlimentar,
    alimentosEvitar: textoOpcional(500)
      .default('')
      .meta({
        description:
          'Lista livre separada por vírgulas. Cada item é comparado com os ingredientes dos pratos.',
        example: 'pimentão, cebola crua',
      }),
    restricoes: z.array(RestricaoAlimentar).max(6).default([]),
    outrasOrientacoes: textoOpcional(1000).default(''),
    consentimento: z.literal(true, {
      error: 'Autorize o uso destes dados para salvar.',
    }).meta({
      description: 'Aceite do colaborador para o tratamento dos dados de saúde (LGPD).',
    }),
  })
  .meta({ id: 'EntradaPreferencias' });

export const PreferenciasColaborador = z
  .object({
    perfil: PerfilAlimentar,
    alimentosEvitar: z.string(),
    restricoes: z.array(RestricaoAlimentar),
    outrasOrientacoes: z.string(),
    consentimentoEm: Instante.nullable(),
    atualizadoEm: Instante.nullable().meta({
      description: 'null enquanto o colaborador não salvou as preferências.',
    }),
  })
  .meta({ id: 'PreferenciasColaborador' });

export const ResultadoPreferencias = z
  .object({ modo: Modo, preferencias: PreferenciasColaborador })
  .meta({ id: 'ResultadoPreferencias' });

export type EntradaPreferenciasDto = z.infer<typeof EntradaPreferencias>;
export type PreferenciasDto = z.infer<typeof PreferenciasColaborador>;
