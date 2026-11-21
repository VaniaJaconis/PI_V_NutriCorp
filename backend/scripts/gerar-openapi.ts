// Gera docs/openapi.json a partir dos esquemas em src/contratos (npm run openapi).
import { mkdirSync, writeFileSync } from 'node:fs';
import { gerarDocumentoOpenApi } from '../src/contratos/openapi.js';

const destino = new URL('../docs/openapi.json', import.meta.url);
mkdirSync(new URL('.', destino), { recursive: true });
writeFileSync(destino, `${JSON.stringify(gerarDocumentoOpenApi(), null, 2)}\n`);
console.log(`Contrato gerado em ${destino.pathname}`);
