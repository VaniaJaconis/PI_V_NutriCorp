import { Router } from 'express';
import { Credenciais, NovaOrganizacao, NovoColaborador } from '../../contratos/contas.js';
import type { Servicos } from '../../servicos/index.js';
import { exigirSessao, sessaoDe, validar } from '../middlewares.js';

export function rotasPublicas(servicos: Servicos) {
  const rotas = Router();

  rotas.get('/saude', (_req, res) => {
    res.json({ status: 'ok' });
  });

  rotas.post('/organizacoes', async (req, res) => {
    const dados = validar(NovaOrganizacao, req.body);
    res.status(201).json(await servicos.contas.cadastrarOrganizacao(dados));
  });

  rotas.post('/colaboradores', async (req, res) => {
    const dados = validar(NovoColaborador, req.body);
    res.status(201).json(await servicos.contas.cadastrarColaborador(dados));
  });

  rotas.post('/auth/login', async (req, res) => {
    const dados = validar(Credenciais, req.body);
    res.json(await servicos.contas.entrar(dados));
  });

  rotas.get('/auth/sessao', exigirSessao(servicos), (_req, res) => {
    res.json(sessaoDe(res));
  });

  return rotas;
}
