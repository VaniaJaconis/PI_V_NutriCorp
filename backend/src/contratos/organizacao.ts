import { z } from './zod.js';
import { DataIso, Id, Instante } from './comum.js';

export const MAX_DIAS_INDICADORES = 92;

export const FiltroIndicadores = z
  .object({
    inicio: DataIso.optional().meta({ description: 'Padrão: 6 dias antes do fim.' }),
    fim: DataIso.optional().meta({ description: 'Padrão: hoje (America/Sao_Paulo).' }),
  })
  .refine((f) => !f.inicio || !f.fim || f.inicio <= f.fim, {
    path: ['fim'],
    error: 'O fim deve ser igual ou posterior ao início.',
  });

export const IndicadoresConsolidados = z
  .object({
    periodo: z.object({ inicio: DataIso, fim: DataIso }),
    colaboradoresAtivos: z.number().int(),
    refeicoesRegistradas: z.number().int(),
    taxaAdesao: z.number().int().meta({
      description: '% de colaboradores ativos com pelo menos um registro no período.',
    }),
    cardapiosPublicados: z.number().int().meta({
      description: 'Cardápios publicados com data dentro do período.',
    }),
    registrosPorDia: z.array(
      z.object({
        dia: z.string().meta({ example: 'Seg' }),
        data: DataIso,
        valor: z.number().int().meta({ description: 'Quantidade de registros.' }),
        percentual: z.number().int().meta({
          description: 'Valor relativo ao dia com mais registros (0 a 100). Usar na altura da barra.',
        }),
      }),
    ),
    compatibilidade: z
      .object({
        compativeis: z.number().int(),
        parciais: z.number().int(),
        incompativeis: z.number().int(),
      })
      .meta({
        description:
          '% das refeições registradas no período por compatibilidade com as preferências (soma 100, ou 0 sem registros).',
      }),
  })
  .meta({
    id: 'IndicadoresConsolidados',
    description:
      'Somente dados agregados: preferências e restrições individuais nunca são expostas à organização.',
  });

export const ColaboradorResumo = z
  .object({
    id: Id,
    nomeCompleto: z.string(),
    emailCorporativo: z.string(),
    setor: z.string(),
    codigoFuncionario: z.string(),
    ativo: z.boolean(),
    criadoEm: Instante,
  })
  .meta({ id: 'ColaboradorResumo' });

export const EntradaAcesso = z
  .object({ ativo: z.boolean({ error: 'Informe se o acesso está ativo.' }) })
  .meta({ id: 'EntradaAcesso' });

export type FiltroIndicadoresDto = z.infer<typeof FiltroIndicadores>;
export type IndicadoresDto = z.infer<typeof IndicadoresConsolidados>;
export type ColaboradorResumoDto = z.infer<typeof ColaboradorResumo>;
