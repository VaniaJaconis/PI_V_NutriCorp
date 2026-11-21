import type { ErrorRequestHandler, RequestHandler, Response } from 'express';
import type { SessaoDto } from '../contratos/contas.js';
import type { z } from '../contratos/zod.js';
import type { PerfilAcesso } from '../dominio/valores.js';
import { ErroApi, erros } from '../erros.js';
import type { Servicos } from '../servicos/index.js';

declare global {
  namespace Express {
    interface Locals {
      sessao?: SessaoDto;
    }
  }
}

/** Valida com o esquema do contrato e devolve 422 com uma mensagem por campo. */
export function validar<S extends z.ZodType>(esquema: S, dados: unknown): z.output<S> {
  const resultado = esquema.safeParse(dados ?? {});
  if (resultado.success) return resultado.data;
  const campos: Record<string, string> = {};
  for (const problema of resultado.error.issues) {
    const campo = problema.path.join('.') || '_';
    campos[campo] ??= problema.message;
  }
  throw erros.validacao(campos);
}

export function exigirSessao(servicos: Servicos): RequestHandler {
  return async (req, res, next) => {
    const [tipo, token] = (req.get('authorization') ?? '').split(' ');
    if (tipo?.toLowerCase() !== 'bearer' || !token) throw erros.naoAutenticado();
    const dados = servicos.tokens.verificar(token);
    const sessao = dados && (await servicos.contas.carregarSessao(dados));
    if (!sessao)
      throw erros.naoAutenticado('Sessão expirada ou inválida. Faça login novamente.');
    res.locals.sessao = sessao;
    next();
  };
}

export function exigirPerfil(perfil: PerfilAcesso): RequestHandler {
  return (_req, res, next) => {
    if (res.locals.sessao?.perfil !== perfil) throw erros.semPermissao();
    next();
  };
}

export function sessaoDe(res: Response): SessaoDto {
  const sessao = res.locals.sessao;
  if (!sessao) throw erros.naoAutenticado();
  return sessao;
}

export const tratarErros: ErrorRequestHandler = (erro, _req, res, _next) => {
  if (erro instanceof ErroApi) {
    res.status(erro.status).json({
      erro: {
        codigo: erro.codigo,
        mensagem: erro.message,
        ...(erro.campos && { campos: erro.campos }),
      },
    });
    return;
  }
  if (erro?.type === 'entity.parse.failed') {
    res.status(400).json({
      erro: { codigo: 'json_invalido', mensagem: 'O corpo da requisição não é um JSON válido.' },
    });
    return;
  }
  if (erro?.type === 'entity.too.large') {
    res.status(413).json({
      erro: { codigo: 'corpo_muito_grande', mensagem: 'O corpo da requisição é muito grande.' },
    });
    return;
  }
  console.error(erro);
  res.status(500).json({
    erro: { codigo: 'erro_interno', mensagem: 'Erro interno. Tente novamente mais tarde.' },
  });
};
