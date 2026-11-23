import { Router } from 'express';
import { FiltroCardapios } from '../../contratos/cardapios.js';
import { ParametroId } from '../../contratos/comum.js';
import type { Servicos } from '../../servicos/index.js';
import { exigirSessao, sessaoDe, validar } from '../middlewares.js';

export function rotasCardapios(servicos: Servicos) {
  const rotas = Router();
  rotas.use(exigirSessao(servicos));

  rotas.get('/', async (req, res) => {
    const filtro = validar(FiltroCardapios, req.query);
    res.json(await servicos.cardapios.listarRefeicoes(sessaoDe(res), filtro));
  });

  rotas.get('/:id', async (req, res) => {
    const { id } = validar(ParametroId, req.params);
    res.json(await servicos.cardapios.obterRefeicao(sessaoDe(res), id));
  });

  return rotas;
}
