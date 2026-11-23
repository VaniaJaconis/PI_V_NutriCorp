# NutriCorp API

API REST em Node.js + TypeScript (Express). Os contratos são escritos em Zod e geram a documentação OpenAPI em `/api/docs`.

## Executar

```bash
npm install
npm run dev
```

- API: http://localhost:3333/api
- Documentação: http://localhost:3333/api/docs (cópia em `docs/openapi.json`)

Variáveis (opcionais em desenvolvimento, ver `.env.example`):

| Variável | Uso |
|---|---|
| `DATABASE_URL` | PostgreSQL. Sem ela, os dados ficam em memória. |
| `JWT_SECRET` | Obrigatória em produção (32+ caracteres). |
| `SEED_DEMO` | `true` carrega os dados de demonstração (padrão fora de produção). |
| `CORS_ORIGIN` | Origens liberadas quando o front-end roda separado. |

Com `DATABASE_URL`, a API aplica sozinha as migrações de `../database/migrations` que ainda não rodaram (tabela `public.migracoes`).

Dados de demonstração (senha `NutriCorp123!`):

| Usuário | Perfil |
|---|---|
| `organizacao@nutricorp.dev` | organização |
| `colaborador@nutricorp.dev` | colaborador (vegetariana, sem lactose) |
| `bruno.lima@nutricorp.dev` | colaborador |
| `carla.mendes@nutricorp.dev` | colaborador com acesso desativado |

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | API com recarga automática |
| `npm test` | testes (defina `TEST_DATABASE_URL` para rodar também no PostgreSQL) |
| `npm run build` / `npm start` | compila e executa |
| `npm run openapi` | regenera `docs/openapi.json` |

## Estrutura

```
src/
  contratos/     esquemas Zod e OpenAPI
  http/          rotas, autenticação e erros
  servicos/      regras de negócio
  repositorios/  memória e PostgreSQL (mesma interface em tipos.ts)
  dominio/       entidades e valores fixos
```

## Banco de dados

A base é o modelo do Gustavo (`database/migrations/001` e `002`). A migração `003_ajustes_para_api.sql` acrescenta o que as telas usam. O repositório PostgreSQL converte entre os dois modelos:

- Organização: linha em `organizacoes` + usuário com papel `rh`, que faz o login da organização.
- Colaborador: usuário com papel `colaborador` (CPF, setor, código e situação do acesso).
- Preferências: perfil e restrições em `perfis_alimentares` (marcadores), texto livre em `preferencias_colaborador`.
- Cardápio: `cardapios` + um item + uma `refeicao`, com ingredientes, alérgenos (`refeicoes_marcadores`) e informação nutricional.
- Registro de refeição: `consumos`, sem duplicar quando o mesmo `requisicaoId` é reenviado.

## Regras

- Login com JWT (`Authorization: Bearer <token>`). Perfis: `colaborador` e `organizacao`.
- Cada organização só vê os próprios dados. O colaborador só vê cardápios publicados.
- Colaborador desativado perde o acesso na hora.
- Erros: `{ "erro": { "codigo", "mensagem", "campos" } }`.
- A organização só recebe indicadores agregados, nunca as preferências individuais.
