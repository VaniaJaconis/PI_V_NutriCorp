import { criarApp } from './app.js';
import { carregarConfig } from './config.js';
import { popularDadosDemo } from './dadosDemo.js';
import { criarRepositoriosEmMemoria } from './repositorios/memoria/index.js';
import { criarServicos } from './servicos/index.js';

try {
  process.loadEnvFile();
} catch (erro) {
  if ((erro as NodeJS.ErrnoException).code !== 'ENOENT') throw erro;
}

const config = carregarConfig();
// Trocar por criarRepositoriosPostgres() quando a camada de banco estiver pronta.
const repositorios = criarRepositoriosEmMemoria();
const servicos = criarServicos(repositorios, config);
if (config.seedDemo) await popularDadosDemo(servicos);

criarApp(servicos, config).listen(config.porta, () => {
  console.log(`NutriCorp API: http://localhost:${config.porta}/api`);
  console.log(`Documentação: http://localhost:${config.porta}/api/docs`);
  if (config.seedDemo)
    console.log('Dados de demonstração: colaborador@nutricorp.dev / organizacao@nutricorp.dev (senha NutriCorp123!)');
});
