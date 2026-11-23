import { criarApp } from './app.js';
import { carregarConfig } from './config.js';
import { popularDadosDemo } from './dadosDemo.js';
import { criarRepositoriosEmMemoria } from './repositorios/memoria/index.js';
import { criarPool, criarRepositoriosPostgres, migrar } from './repositorios/postgres/index.js';
import { criarServicos } from './servicos/index.js';

try {
  process.loadEnvFile();
} catch {}

const config = carregarConfig();

let repositorios;
if (config.databaseUrl) {
  const pool = criarPool(config.databaseUrl);
  await migrar(pool);
  repositorios = criarRepositoriosPostgres(pool);
} else {
  console.warn('DATABASE_URL não definida: usando dados em memória.');
  repositorios = criarRepositoriosEmMemoria();
}

const servicos = criarServicos(repositorios, config);
if (config.seedDemo) await popularDadosDemo(servicos, repositorios);

criarApp(servicos, config).listen(config.porta, () => {
  console.log(`NutriCorp: http://localhost:${config.porta}`);
});
