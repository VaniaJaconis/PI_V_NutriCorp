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
| `SEED_DEMO` | `true` carrega os dados de demonstração e os atualiza a cada 6 horas (padrão fora de produção). |
| `CORS_ORIGIN` | Origens liberadas quando o front-end roda separado. |

Com `DATABASE_URL`, a API aplica sozinha as migrações de `../database/migrations` que ainda não rodaram (tabela `public.migracoes`).

Dados de demonstração (senha `NutriCorp123!`):

| Usuário | Perfil |
|---|---|
| `organizacao@nutricorp.dev` | organização, papel RH (conta principal) |
| `cozinha@nutricorp.dev` | organização, papel Cozinha |
| `colaborador@nutricorp.dev` | colaborador (vegetariana, sem lactose) |
| `bruno.lima@nutricorp.dev` | colaborador |
| `carla.mendes@nutricorp.dev` | colaborador com acesso desativado |
| `diego.rocha@nutricorp.dev` | colaborador aguardando aprovação |

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | API com recarga automática |
| `npm test` | testes (defina `TEST_DATABASE_URL` para rodar também no PostgreSQL) |
| `npm run build` / `npm start` | compila e executa |
| `npm run openapi` | regenera `docs/openapi.json` |

## Rotas

Todas em `/api`. Detalhes de entrada e saída em `/api/docs`.

| Rota | Uso |
|---|---|
| `GET /cnpj/{cnpj}` | consulta a ReceitaWS e devolve razão social, nome fantasia e setor (cache em memória, só CNPJ numérico) |
| `POST /organizacoes` | cadastro da organização (já devolve o token) |
| `POST /colaboradores` | cadastro do colaborador (fica pendente até a organização aprovar) |
| `POST /auth/login` · `GET /auth/sessao` · `PUT /auth/senha` | login, sessão atual e troca da própria senha |
| `GET /cardapios` · `GET /cardapios/{id}` | consulta de cardápios (colaborador vê só os publicados) |
| `GET` `PUT` `DELETE /colaborador/preferencias` | preferências e restrições (salvar exige `consentimento: true`) |
| `GET /colaborador/cardapios/{id}/compatibilidade` · `PUT .../alternativa` | compatibilidade e escolha de alternativa |
| `GET /colaborador/registros/opcoes` · `GET` `POST /colaborador/registros` | opções do dia, histórico e registro |
| `PATCH` `DELETE /colaborador/registros/{id}` | editar observações ou excluir um registro |
| `GET` `POST /organizacao/cardapios` · `GET` `PUT` `DELETE /organizacao/cardapios/{id}` | cadastro de cardápios |
| `GET /organizacao/indicadores?inicio=&fim=` | indicadores agregados (até 92 dias) |
| `GET /organizacao/colaboradores` · `PATCH /organizacao/colaboradores/{id}` | controle de acesso (`ativo: true` também aprova) |
| `POST /organizacao/colaboradores/{id}/senha` | gera senha temporária para o colaborador |
| `GET` `POST /organizacao/equipe` · `PATCH /organizacao/equipe/{id}` · `POST .../senha` | equipe de RH e Cozinha (só RH) |

Permissões no perfil `organizacao`: **RH** acessa colaboradores, equipe, indicadores e consulta cardápios. **Cozinha** cria, edita e exclui cardápios e consulta indicadores.

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

A base é o modelo do Gustavo (`database/migrations/001` e `002`). As migrações `003_ajustes_para_api.sql` e `004_aprovacao_e_consentimento.sql` acrescentam o que as telas usam. O repositório PostgreSQL converte entre os dois modelos:

- Organização: linha em `organizacoes` + usuário com papel `rh`, que faz o login da organização (conta principal).
- Equipe: demais usuários com papel `rh` ou `cozinha` da mesma organização.
- Colaborador: usuário com papel `colaborador` (CPF, setor, código, aprovação e situação do acesso).
- Preferências: perfil e restrições em `perfis_alimentares` (marcadores), texto livre e data do consentimento em `preferencias_colaborador`.
- Cardápio: `cardapios` + um item + uma `refeicao`, com ingredientes, alérgenos (`refeicoes_marcadores`) e informação nutricional.
- Registro de refeição: `consumos`, sem duplicar quando o mesmo `requisicaoId` é reenviado.

## Regras

- Login com JWT (`Authorization: Bearer <token>`). Perfis: `colaborador` e `organizacao`.
- Cada organização só vê os próprios dados. O colaborador só vê cardápios publicados.
- Colaborador desativado perde o acesso na hora.
- Colaborador recém-cadastrado só entra depois que a organização aprovar.
- Login, cadastros e troca de senha: até 20 tentativas a cada 15 minutos por IP.
- Sem serviço de e-mail: quem esquece a senha recebe uma senha temporária do RH e depois a troca.
- Erros: `{ "erro": { "codigo", "mensagem", "campos" } }`.
- A organização só recebe indicadores agregados, nunca as preferências individuais.
