import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import type { Config } from './config.js';
import { gerarDocumentoOpenApi } from './contratos/openapi.js';
import { erros } from './erros.js';
import { tratarErros } from './http/middlewares.js';
import { rotasCardapios } from './http/rotas/cardapios.js';
import { rotasColaborador } from './http/rotas/colaborador.js';
import { rotasOrganizacao } from './http/rotas/organizacao.js';
import { rotasPublicas } from './http/rotas/publicas.js';
import type { Servicos } from './servicos/index.js';

const PASTA_FRONTEND = fileURLToPath(new URL('../../my-app/dist/', import.meta.url));

export function criarApp(servicos: Servicos, config: Config) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: config.origensCors }));
  app.use(express.json({ limit: '100kb' }));

  const documento = gerarDocumentoOpenApi();
  app.get('/api/openapi.json', (_req, res) => {
    res.json(documento);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(documento));

  app.use('/api', rotasPublicas(servicos));
  app.use('/api/cardapios', rotasCardapios(servicos));
  app.use('/api/colaborador', rotasColaborador(servicos));
  app.use('/api/organizacao', rotasOrganizacao(servicos));
  app.use('/api', () => {
    throw erros.naoEncontrado('Rota não encontrada.');
  });

  if (existsSync(PASTA_FRONTEND)) app.use(express.static(PASTA_FRONTEND));
  else app.get('/', (_req, res) => res.redirect('/api/docs'));

  app.use(tratarErros);
  return app;
}
