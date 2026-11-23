import { Router } from 'express';
import { EntradaSelecaoAlternativa } from '../../contratos/cardapios.js';
import { ParametroId } from '../../contratos/comum.js';
import { EntradaPreferencias } from '../../contratos/preferencias.js';
import { EntradaRegistro, FiltroOpcoesRegistro } from '../../contratos/registros.js';
import type { Servicos } from '../../servicos/index.js';
import { exigirPerfil, exigirSessao, sessaoDe, validar } from '../middlewares.js';

export function rotasColaborador(servicos: Servicos) {
  const rotas = Router();
  rotas.use(exigirSessao(servicos), exigirPerfil('colaborador'));

  rotas.get('/preferencias', async (_req, res) => {
    res.json(await servicos.preferencias.consultar(sessaoDe(res).id));
  });

  rotas.put('/preferencias', async (req, res) => {
    const dados = validar(EntradaPreferencias, req.body);
    res.json(await servicos.preferencias.salvar(sessaoDe(res).id, dados));
  });

  rotas.get('/cardapios/:id/compatibilidade', async (req, res) => {
    const { id } = validar(ParametroId, req.params);
    res.json(await servicos.cardapios.consultarCompatibilidade(sessaoDe(res), id));
  });

  rotas.put('/cardapios/:id/alternativa', async (req, res) => {
    const { id } = validar(ParametroId, req.params);
    const { alternativaId } = validar(EntradaSelecaoAlternativa, req.body);
    res.json(
      await servicos.cardapios.selecionarAlternativa(sessaoDe(res), id, alternativaId),
    );
  });

  rotas.get('/registros/opcoes', async (req, res) => {
    const { data } = validar(FiltroOpcoesRegistro, req.query);
    res.json(await servicos.registros.listarOpcoes(sessaoDe(res), data));
  });

  rotas.get('/registros', async (_req, res) => {
    res.json(await servicos.registros.listarHistorico(sessaoDe(res)));
  });

  rotas.post('/registros', async (req, res) => {
    const dados = validar(EntradaRegistro, req.body);
    const { registro, criado } = await servicos.registros.registrar(sessaoDe(res), dados);
    res.status(criado ? 201 : 200).json(registro);
  });

  return rotas;
}
