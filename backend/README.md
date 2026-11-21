# NutriCorp API (back-end)

API REST do NutriCorp em **Node.js + TypeScript** (Express 5). O contrato é escrito com **Zod** e vira documentação **OpenAPI 3** automaticamente, então validação e documentação nunca ficam desalinhadas.

Nesta etapa a persistência é **em memória** (os dados somem ao reiniciar). A troca por PostgreSQL é feita implementando as interfaces de `src/repositorios/tipos.ts`, sem mexer em rotas nem serviços.

## Como executar

Requisitos: Node.js 20.12 ou superior.

```bash
cd backend
npm install
npm run dev        # http://localhost:3333/api
```

- Documentação interativa (Swagger): http://localhost:3333/api/docs
- Contrato em JSON: http://localhost:3333/api/openapi.json (cópia versionada em `docs/openapi.json`)
- Configuração: copie `.env.example` para `.env` (opcional em desenvolvimento).

Ao iniciar, a API carrega **dados de demonstração** (cardápios da semana, registros e indicadores). Senha de todas as contas: `NutriCorp123!`

| Usuário | Perfil | Observação |
|---|---|---|
| `organizacao@nutricorp.dev` | organização | NutriCorp Demo, CNPJ 11.222.333/0001-81 |
| `colaborador@nutricorp.dev` | colaborador | Ana: vegetariana, restrição a lactose, evita pimentão |
| `bruno.lima@nutricorp.dev` | colaborador | sem preferências |
| `carla.mendes@nutricorp.dev` | colaborador | acesso desativado (demonstra o controle de acesso) |

| Script | O que faz |
|---|---|
| `npm run dev` | API com recarga automática |
| `npm test` | testes de integração (Vitest + Supertest) |
| `npm run typecheck` | checagem de tipos |
| `npm run build` / `npm start` | compila para `dist/` e executa |
| `npm run openapi` | regenera `docs/openapi.json` (rodar sempre que mudar um contrato) |

## Arquitetura

```
src/
  contratos/      Esquemas Zod de entrada e saída + registro das rotas no OpenAPI
  http/           Rotas Express, autenticação, validação e tratamento de erros
  servicos/       Regras de negócio (compatibilidade, indicadores, cadastro, registros)
  repositorios/   Interfaces de persistência (tipos.ts) e implementação em memória
  dominio/        Entidades e valores fixos (base para as tabelas do banco)
  dadosDemo.ts    Dados de demonstração
  app.ts          Montagem do Express
  servidor.ts     Ponto de entrada
```

Fluxo de uma requisição: **rota** (valida com o contrato e confere o perfil) → **serviço** (regra de negócio) → **repositório** (dados).

### Divisão de responsabilidades

| Parte | Responsável | Onde |
|---|---|---|
| Arquitetura, contratos, endpoints e integração | Gabriel | `src/contratos`, `src/http`, `src/app.ts` |
| Implementação dos serviços | Vania | `src/servicos` (já existe uma primeira versão funcional para evoluir) |
| Entidades, relacionamentos e migrações | Gustavo | `src/dominio/entidades.ts` (referência) e nova pasta `src/repositorios/postgres` implementando `tipos.ts` |

Para plugar o banco: criar `criarRepositoriosPostgres()` retornando o mesmo tipo `Repositorios` e trocar a linha indicada em `src/servidor.ts`. As regras de unicidade estão documentadas em `tipos.ts` (CNPJ, e-mails, CPF, código do funcionário por organização e `(colaborador, requisicaoId)` nos registros).

## Convenções do contrato

- **Autenticação:** `POST /api/auth/login` devolve um JWT. Enviar em `Authorization: Bearer <token>`. Os cadastros também devolvem o token (o usuário já entra logado).
- **Usuário do login:** o e-mail cadastrado (corporativo do colaborador ou de comunicação da organização).
- **Perfis:** `colaborador` acessa `/api/colaborador/*`; `organizacao` acessa `/api/organizacao/*`; os dois acessam `/api/cardapios`. Cada organização só enxerga os próprios dados.
- **Erros:** sempre `{ "erro": { "codigo", "mensagem", "campos"? } }`. Em `422`, `campos` traz a mensagem pronta de cada campo (mesmos textos das validações do frontend).
- **Datas:** `AAAA-MM-DD`, horários `HH:MM`, fuso `America/Sao_Paulo`.
- **Registro de refeição idempotente:** o cliente gera um `requisicaoId` por envio; repetir o mesmo valor devolve o registro existente (`200`) em vez de duplicar.
- **LGPD:** preferências e restrições alimentares são dados de saúde. A organização só recebe indicadores agregados; a listagem de colaboradores não traz CPF nem preferências.

## Endpoints e integração com o frontend

Cada função em `my-app/src/services` (branch `frontend/cadastro-colaborador`) tem um comentário "Integrar ... com o backend aqui". Mapeamento:

| Tela / função do frontend | Endpoint |
|---|---|
| Cadastro da organização / `cadastrarOrganizacao` | `POST /api/organizacoes` |
| Cadastro do colaborador / `cadastrarColaborador` | `POST /api/colaboradores` |
| Login / `entrar` | `POST /api/auth/login` (e `GET /api/auth/sessao` ao recarregar a página) |
| Preferências / `consultarPreferencias`, `salvarPreferencias` | `GET` e `PUT /api/colaborador/preferencias` |
| Cardápios (colaborador e organização) / `consultarCardapios` | `GET /api/cardapios?data=&refeicao=` |
| Compatibilidade / `consultarAlternativas` | `GET /api/colaborador/cardapios/{id}/compatibilidade` |
| Compatibilidade / `selecionarAlternativa` | `PUT /api/colaborador/cardapios/{id}/alternativa` |
| Registro de refeições / `consultarOpcoesRegistro` | `GET /api/colaborador/registros/opcoes?data=` |
| Registro de refeições / `consultarHistoricoRefeicoes`, `registrarRefeicao` | `GET` e `POST /api/colaborador/registros` |
| Cadastro de cardápio / `consultarCardapioOrganizacao`, `salvarCardapioOrganizacao` | `GET`, `POST`, `PUT`, `DELETE /api/organizacao/cardapios[/{id}]` |
| Indicadores / `consultarIndicadoresConsolidados` | `GET /api/organizacao/indicadores?inicio=&fim=` |
| Controle de acesso (tela pendente) | `GET /api/organizacao/colaboradores` e `PATCH /api/organizacao/colaboradores/{id}` |

Ajustes necessários no frontend ao integrar:

1. **Cadastro de cardápio:** o formulário usa texto; a API usa tipos próprios. `preparacoes` e `ingredientes` viram listas (separar por linha/vírgula), os campos nutricionais viram números dentro de `nutricional` (`porcaoGramas`, `energiaKcal`, `carboidratosG`, `proteinasG`, `gordurasG`, `sodioMg`) e os alérgenos usam os códigos de `RestricaoAlimentar` (`Leite` → `lactose`, `Glúten` → `gluten`, demais em minúsculas). Os campos `podeConter` e `perfisCompativeis` são novos e opcionais; sem `perfisCompativeis`, o prato é considerado incompatível com perfis vegetarianos.
2. **Compatibilidade:** a API devolve `alternativas` (lista). O frontend hoje usa uma única `alternativa`: usar a primeira da lista. A avaliação de cada prato já vem calculada em `avaliacoes`.
3. **Indicadores:** usar `percentual` (e não `valor`) para a altura das barras de "Refeições registradas por dia".
4. **Cadastro do colaborador:** o campo "Empresa" deve receber o CNPJ (ou o nome fantasia exato) de uma organização já cadastrada.

## Pontos para validar com o grupo

- Perfis "Cozinha" e "RH" do documento de referência estão unificados em `organizacao`, como no frontend atual.
- Cada cardápio cadastrado pela organização vira **uma refeição com um prato** (as preparações compõem o nome do prato), porque o formulário informa ingredientes e alérgenos do conjunto.
- "Alternativas" de uma refeição são os outros cardápios publicados no mesmo dia e tipo de refeição que sejam compatíveis com o colaborador.
- Regra de senha: mínimo de 8 caracteres (igual ao frontend).
