import { z } from './zod.js';
import {
  Id,
  Instante,
  Modo,
  PerfilAcesso,
  textoObrigatorio,
  MSG_OBRIGATORIO,
} from './comum.js';
import { cnpjValido, cpfValido } from '../util/documentos.js';

const Email = z
  .string({ error: MSG_OBRIGATORIO })
  .trim()
  .min(1, { error: MSG_OBRIGATORIO })
  .max(254, { error: 'Use até 254 caracteres.' })
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { error: 'Informe um e-mail válido.' })
  .meta({ format: 'email', example: 'ana.souza@empresa.com.br' });

const Senha = z
  .string({ error: MSG_OBRIGATORIO })
  .min(1, { error: MSG_OBRIGATORIO })
  .min(8, { error: 'Use pelo menos 8 caracteres.' })
  .max(128, { error: 'Use até 128 caracteres.' })
  .meta({ format: 'password', example: 'NutriCorp123!' });

export const NovaOrganizacao = z
  .object({
    razaoSocial: textoObrigatorio(200),
    cnpj: textoObrigatorio(18)
      .refine(cnpjValido, { error: 'Informe um CNPJ válido.' })
      .meta({
        description: 'Com ou sem máscara. Aceita o CNPJ alfanumérico.',
        example: '11.222.333/0001-81',
      }),
    nomeFantasia: textoObrigatorio(120),
    setor: textoObrigatorio(120),
    emailComunicacao: Email.meta({
      description: 'Também é o usuário de login da organização.',
    }),
    senha: Senha,
  })
  .meta({ id: 'NovaOrganizacao' });

export const NovoColaborador = z
  .object({
    nomeCompleto: textoObrigatorio(200).refine(
      (nome) => nome.split(/\s+/).length >= 2,
      { error: 'Informe seu nome completo.' },
    ),
    cpf: textoObrigatorio(14)
      .refine(cpfValido, { error: 'Informe um CPF válido.' })
      .meta({ description: 'Com ou sem máscara.', example: '123.456.789-09' }),
    empresa: textoObrigatorio(200).meta({
      description:
        'CNPJ (recomendado) ou nome fantasia/razão social de uma organização já cadastrada.',
      example: '11.222.333/0001-81',
    }),
    setor: textoObrigatorio(120),
    codigoFuncionario: textoObrigatorio(60),
    emailCorporativo: Email.meta({
      description: 'Também é o usuário de login do colaborador.',
    }),
    senha: Senha,
  })
  .meta({ id: 'NovoColaborador' });

export const Credenciais = z
  .object({
    usuario: textoObrigatorio(254, 'Informe seu usuário.').meta({
      description:
        'E-mail cadastrado (corporativo do colaborador ou de comunicação da organização).',
      example: 'colaborador@nutricorp.dev',
    }),
    senha: z
      .string({ error: 'Informe sua senha.' })
      .min(1, { error: 'Informe sua senha.' })
      .max(128)
      .meta({ format: 'password', example: 'NutriCorp123!' }),
  })
  .meta({ id: 'CredenciaisLogin' });

const OrganizacaoResumo = z.object({ id: Id, nome: z.string() });

export const Sessao = z
  .object({
    id: Id,
    nome: z.string().meta({ example: 'Ana Souza' }),
    perfil: PerfilAcesso,
    organizacao: OrganizacaoResumo,
  })
  .meta({ id: 'Sessao' });

export const ResultadoLogin = Sessao.extend({
  token: z.string().meta({
    description: 'JWT. Enviar em "Authorization: Bearer <token>".',
  }),
  expiraEm: Instante,
  modo: Modo,
}).meta({
  id: 'ResultadoLogin',
  description:
    'Também é a resposta dos cadastros: após cadastrar, o usuário já fica autenticado.',
});

export const ResultadoCadastroColaborador = z
  .object({
    id: Id,
    nome: z.string(),
    organizacao: OrganizacaoResumo,
    situacao: z.literal('pendente'),
    mensagem: z.string(),
  })
  .meta({
    id: 'ResultadoCadastroColaborador',
    description: 'O colaborador só consegue entrar depois que a organização aprovar o cadastro.',
  });

export const EntradaAlterarSenha = z
  .object({
    senhaAtual: z.string({ error: 'Informe a senha atual.' }).min(1, { error: 'Informe a senha atual.' }),
    novaSenha: Senha,
  })
  .meta({ id: 'EntradaAlterarSenha' });

export type NovaOrganizacaoDto = z.infer<typeof NovaOrganizacao>;
export type NovoColaboradorDto = z.infer<typeof NovoColaborador>;
export type CredenciaisDto = z.infer<typeof Credenciais>;
export type SessaoDto = z.infer<typeof Sessao>;
export type ResultadoLoginDto = z.infer<typeof ResultadoLogin>;
