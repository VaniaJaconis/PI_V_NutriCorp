import { Router } from 'express';
import { EntradaCardapio, FiltroCardapios } from '../../contratos/cardapios.js';
import { ParametroId } from '../../contratos/comum.js';
import { NovoMembroEquipe } from '../../contratos/contas.js';
import { EntradaAcesso, FiltroIndicadores } from '../../contratos/organizacao.js';
import type { Servicos } from '../../servicos/index.js';
import { exigirPapel, exigirPerfil, exigirSessao, sessaoDe, validar } from '../middlewares.js';

export function rotasOrganizacao(servicos: Servicos) {
  const rotas = Router();
  rotas.use(exigirSessao(servicos), exigirPerfil('organizacao'));
  const organizacaoId = (res: Parameters<typeof sessaoDe>[0]) => sessaoDe(res).organizacao.id;
  const rh = exigirPapel('rh');
  const cozinha = exigirPapel('cozinha');

  rotas.get('/cardapios', async (req, res) => {
    const filtro = validar(FiltroCardapios, req.query);
    res.json(await servicos.cardapios.listarDaOrganizacao(organizacaoId(res), filtro));
  });

  rotas.post('/cardapios', cozinha, async (req, res) => {
    const dados = validar(EntradaCardapio, req.body);
    res.status(201).json(await servicos.cardapios.criar(organizacaoId(res), dados));
  });

  rotas.get('/cardapios/:id', async (req, res) => {
    const { id } = validar(ParametroId, req.params);
    res.json(await servicos.cardapios.obterDaOrganizacao(organizacaoId(res), id));
  });

  rotas.put('/cardapios/:id', cozinha, async (req, res) => {
    const { id } = validar(ParametroId, req.params);
    const dados = validar(EntradaCardapio, req.body);
    res.json(await servicos.cardapios.atualizar(organizacaoId(res), id, dados));
  });

  rotas.delete('/cardapios/:id', cozinha, async (req, res) => {
    const { id } = validar(ParametroId, req.params);
    await servicos.cardapios.remover(organizacaoId(res), id);
    res.status(204).end();
  });

  rotas.get('/indicadores', async (req, res) => {
    const filtro = validar(FiltroIndicadores, req.query);
    res.json(await servicos.organizacao.consolidarIndicadores(organizacaoId(res), filtro));
  });

  rotas.get('/colaboradores', rh, async (_req, res) => {
    res.json(await servicos.organizacao.listarColaboradores(organizacaoId(res)));
  });

  rotas.patch('/colaboradores/:id', rh, async (req, res) => {
    const { id } = validar(ParametroId, req.params);
    const { ativo } = validar(EntradaAcesso, req.body);
    res.json(await servicos.organizacao.alterarAcesso(organizacaoId(res), id, ativo));
  });

  rotas.post('/colaboradores/:id/senha', rh, async (req, res) => {
    const { id } = validar(ParametroId, req.params);
    res.json(await servicos.organizacao.redefinirSenha(organizacaoId(res), id));
  });

  rotas.get('/equipe', rh, async (_req, res) => {
    res.json(await servicos.organizacao.listarEquipe(organizacaoId(res)));
  });

  rotas.post('/equipe', rh, async (req, res) => {
    const dados = validar(NovoMembroEquipe, req.body);
    res.status(201).json(await servicos.organizacao.adicionarMembro(organizacaoId(res), dados));
  });

  rotas.patch('/equipe/:id', rh, async (req, res) => {
    const { id } = validar(ParametroId, req.params);
    const { ativo } = validar(EntradaAcesso, req.body);
    res.json(await servicos.organizacao.alterarMembro(organizacaoId(res), id, ativo));
  });

  rotas.post('/equipe/:id/senha', rh, async (req, res) => {
    const { id } = validar(ParametroId, req.params);
    res.json(await servicos.organizacao.redefinirSenhaMembro(organizacaoId(res), id));
  });

  return rotas;
}
