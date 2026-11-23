import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  Credenciais,
  EntradaAlterarSenha,
  NovaOrganizacao,
  NovoColaborador,
} from '../../contratos/contas.js';
import type { Servicos } from '../../servicos/index.js';
import { exigirSessao, sessaoDe, validar } from '../middlewares.js';

export function rotasPublicas(servicos: Servicos) {
  const rotas = Router();
  const limite = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      erro: {
        codigo: 'muitas_tentativas',
        mensagem: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
      },
    },
  });

  rotas.get('/saude', (_req, res) => {
    res.json({ status: 'ok' });
  });

  rotas.post('/organizacoes', limite, async (req, res) => {
    const dados = validar(NovaOrganizacao, req.body);
    res.status(201).json(await servicos.contas.cadastrarOrganizacao(dados));
  });

  rotas.post('/colaboradores', limite, async (req, res) => {
    const dados = validar(NovoColaborador, req.body);
    res.status(201).json(await servicos.contas.cadastrarColaborador(dados));
  });

  rotas.post('/auth/login', limite, async (req, res) => {
    const dados = validar(Credenciais, req.body);
    res.json(await servicos.contas.entrar(dados));
  });

  rotas.get('/auth/sessao', exigirSessao(servicos), (_req, res) => {
    res.json(sessaoDe(res));
  });

  rotas.put('/auth/senha', limite, exigirSessao(servicos), async (req, res) => {
    const { senhaAtual, novaSenha } = validar(EntradaAlterarSenha, req.body);
    await servicos.contas.alterarSenha(sessaoDe(res), senhaAtual, novaSenha);
    res.status(204).end();
  });

  return rotas;
}
