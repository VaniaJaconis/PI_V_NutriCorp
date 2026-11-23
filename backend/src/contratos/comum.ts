import { z } from './zod.js';
import {
  ESTADOS_CARDAPIO,
  PERFIS_ACESSO,
  PERFIS_ALIMENTARES,
  RESTRICOES_ALIMENTARES,
  SITUACOES_COMPATIBILIDADE,
  TIPOS_REFEICAO,
} from '../dominio/valores.js';
import { dataValida } from '../util/datas.js';

export const MSG_OBRIGATORIO = 'Preencha este campo.';

export const textoObrigatorio = (max: number, mensagem = MSG_OBRIGATORIO) =>
  z
    .string({ error: mensagem })
    .trim()
    .min(1, { error: mensagem })
    .max(max, { error: `Use até ${max} caracteres.` });

export const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Use até ${max} caracteres.` });

export const Id = z.string().meta({ example: '0b6f1d8e-3c2a-4f57-9a8e-1f2d3c4b5a69' });

export const Instante = z
  .string()
  .meta({ format: 'date-time', example: '2026-11-20T15:15:00.000Z' });

export const DataIso = z
  .string({ error: 'Informe uma data válida.' })
  .refine(dataValida, { error: 'Informe uma data válida.' })
  .meta({ format: 'date', example: '2026-11-20' });

export const Horario = z
  .string({ error: 'Informe um horário válido.' })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: 'Informe um horário válido.' })
  .meta({ example: '11:30' });

export const PerfilAcesso = z.enum(PERFIS_ACESSO).meta({ id: 'PerfilAcesso' });

export const TipoRefeicao = z
  .enum(TIPOS_REFEICAO, { error: 'Selecione uma refeição válida.' })
  .meta({ id: 'TipoRefeicao' });

export const PerfilAlimentar = z
  .enum(PERFIS_ALIMENTARES, { error: 'Selecione um perfil alimentar válido.' })
  .meta({ id: 'PerfilAlimentar' });

export const RestricaoAlimentar = z
  .enum(RESTRICOES_ALIMENTARES, { error: 'Restrição alimentar inválida.' })
  .meta({
    id: 'RestricaoAlimentar',
    description:
      'No cadastro de cardápio, "Leite" corresponde a "lactose" e "Glúten" a "gluten".',
  });

export const EstadoCardapio = z
  .enum(ESTADOS_CARDAPIO, { error: 'Estado do cardápio inválido.' })
  .meta({ id: 'EstadoCardapio' });

export const SituacaoCompatibilidade = z
  .enum(SITUACOES_COMPATIBILIDADE)
  .meta({
    id: 'SituacaoCompatibilidade',
    description:
      'compativel: sem alertas. parcial: só alertas leves (traços, alimentos a evitar) ou informações incompletas. incompativel: contém restrição ou não atende ao perfil alimentar.',
  });

export const Modo = z.literal('api').meta({
  description:
    'Sempre "api". Mantido para compatibilidade com os serviços simulados do frontend ("simulado").',
});

export const RespostaErro = z
  .object({
    erro: z.object({
      codigo: z.string().meta({ example: 'validacao' }),
      mensagem: z.string().meta({ example: 'Verifique os campos destacados.' }),
      campos: z
        .record(z.string(), z.string())
        .optional()
        .meta({
          description:
            'Mensagem por campo (caminho separado por ponto), pronta para exibir no formulário.',
          example: { cpf: 'Informe um CPF válido.' },
        }),
    }),
  })
  .meta({ id: 'Erro' });

export const ParametroId = z.object({ id: Id });
