
<h5 align="left"><br><img width="775" height="182" alt="image (34)" src="https://github.com/user-attachments/assets/32540959-8393-4164-987c-6533571b1c0a" /><br>
Logo criado para a NutriCorp que consiste no nome do projeto escrito com letras verdes com estilo que remete à tecnologia.

**Sistema publicado:** https://nutricorp-production.up.railway.app

## Índice
* [Descrição do Projeto](#descrição-do-projeto)
* [Objetivos](#objetivos)
* [Funcionalidades](#funcionalidades)
* [Perfis de Acesso](#perfis-de-acesso)
* [Privacidade e LGPD](#privacidade-e-lgpd)
* [Tecnologias Utilizadas](#tecnologias-utilizadas)
* [Estrutura do Projeto](#estrutura-do-projeto)
* [Protótipo](#protótipo)
* [Vídeo Demonstrativo](#vídeo-demonstrativo)
* [Instruções de Execução](#intruções-de-execução)
* [Autores do Projeto](#autores-do-projeto)
* [Licença e Finalidade Acadêmica](#licença-e-finalidade-acadêmica)

## Descrição do Projeto

O NutriCorp é uma plataforma digital B2B (*Business to Business*) voltada a médias e grandes organizações. A solução integra saúde preventiva, gestão nutricional e alimentação corporativa em um único ambiente tecnológico, conectando três frentes estratégicas: Recursos Humanos (RH), Saúde e Segurança no Trabalho (SST) e Serviços de Alimentação Corporativa.

O projeto surgiu da necessidade de centralizar informações relacionadas a cardápios, preferências alimentares e iniciativas de promoção da saúde, aproximando colaboradores, gestores e responsáveis pelos serviços de alimentação por meio de uma ferramenta de apoio à educação nutricional e ao incentivo de hábitos alimentares mais saudáveis.

Por meio das informações fornecidas voluntariamente pelos colaboradores, a plataforma propõe disponibilizar informações nutricionais e recomendações personalizadas, além de permitir a consulta aos cardápios dos refeitórios corporativos e restaurantes parceiros.

O NutriCorp não tem como finalidade realizar diagnósticos médicos ou substituir o acompanhamento de profissionais de saúde. Sua proposta é atuar como uma ferramenta de apoio à prevenção, à educação nutricional e à promoção de hábitos alimentares saudáveis, considerando os requisitos de segurança e proteção de dados pessoais.

A plataforma busca transformar a alimentação no ambiente de trabalho em uma oportunidade de promoção da saúde, prevenção e melhoria da qualidade de vida, contribuindo também para o bem-estar e a valorização dos colaboradores e para o aprimoramento da gestão da alimentação corporativa.

## Objetivos

Desenvolver uma plataforma corporativa integrada de saúde preventiva e gestão nutricional que possibilite às organizações promover hábitos alimentares mais saudáveis, facilitar o acesso dos colaboradores a informações nutricionais e apoiar a gestão dos serviços de alimentação corporativa, utilizando a tecnologia como instrumento de integração entre colaboradores, gestores e serviços de alimentação.

## Funcionalidades

### MVP (Produto Mínimo Viável)

A primeira versão do NutriCorp contempla as funcionalidades essenciais para demonstrar a proposta da plataforma:

1. Cadastro da organização.
2. Cadastro do colaborador.
3. Login e controle de acesso.
4. Cadastro de preferências e restrições alimentares.
5. Cadastro de cardápios.
6. Consulta ao cardápio pelo colaborador.
7. Exibição de informações nutricionais.
8. Identificação de refeições incompatíveis com restrições cadastradas.
9. Registro das refeições.
10. Painel básico com indicadores consolidados.

### Recursos complementares
- Recursos Humanos e Cozinha com perfis e permissões separados na mesma organização.
- Preenchimento automático da razão social, do nome fantasia e do setor a partir do CNPJ (consulta pública da ReceitaWS).
- Aprovação, pela organização, do cadastro de novos colaboradores.
- Senha temporária gerada pelo RH e troca de senha pelo próprio usuário.
- Consentimento explícito para uso dos dados de saúde e exclusão desses dados a qualquer momento (LGPD).
- Edição e exclusão de refeições registradas.
- Cardápios organizados por dia e indicadores por período (7, 15 ou 30 dias).

### Funcionalidades futuras

Funcionalidades mais avançadas poderão ser incorporadas em versões futuras, como integração com sistemas corporativos, integração com restaurantes externos e recursos analíticos mais avançados.

## Perfis de Acesso
- **RH:** aprova e gerencia o acesso dos colaboradores, cadastra a equipe (outras pessoas do RH e da Cozinha), consulta cardápios e indicadores agregados. A conta criada no cadastro da organização é do RH.
- **Cozinha:** cadastra e publica cardápios com as informações nutricionais e consulta os indicadores agregados.
- **Colaborador:** registra preferências e restrições, consulta cardápios e compatibilidade e registra as refeições consumidas. O acesso é liberado após a aprovação do RH.

## Privacidade e LGPD
Preferências e restrições alimentares são dados de saúde. O colaborador autoriza o uso antes de salvar e pode excluí-los quando quiser. A organização acessa apenas indicadores agregados, nunca as escolhas individuais.

## Tecnologias Utilizadas

### Front-end
- React.js + TypeScript (Vite)

### Back-end
- Node.js + TypeScript (Express)
- Zod e OpenAPI (documentação em `/api/docs`)

### Banco de Dados
- PostgreSQL

### Infraestrutura e Ferramentas
- Figma
- GitHub e GitHub Actions (testes automáticos)
- Railway (aplicação e PostgreSQL)

## Estrutura do Projeto 

```
my-app/      Front-end (React + Vite)
backend/     API (Node.js + TypeScript + Express)
database/    Migrações do PostgreSQL
docs/        Modelagem de dados e DER
.github/     Testes automáticos (GitHub Actions)
```

Em produção, um único serviço no Railway serve a API em `/api` e o front-end na raiz, usando o PostgreSQL do Railway.

## Protótipo

### Tela Inicial
<img width="1920" height="856" alt="Aplicação Web" src="https://github.com/user-attachments/assets/2896469c-005e-4123-801e-33367d77b883" />

### Fluxo Colaborador
<img width="1920" height="856" alt="Aplicação Web - Cadastro Usuário" src="https://github.com/user-attachments/assets/43a8a2a7-d38d-44d8-afd7-788249e70b97" />
<img width="1920" height="856" alt="Aplicação Web Colaborador - Tela inicial" src="https://github.com/user-attachments/assets/e38b6f63-524c-4e33-96f6-b77cb56df17c" />
<img width="1920" height="856" alt="NutriCorp — Preferências e restrições alimentares" src="https://github.com/user-attachments/assets/d58d8382-9e82-4a07-99de-28bbf2a66638" />
<img width="1920" height="856" alt="Aplicação Web Colaborador - Cardápios" src="https://github.com/user-attachments/assets/a65338cd-e842-410e-a7f5-f63eae202a7c" />
<img width="1920" height="856" alt="Aplicação Web Colaborador - Cardápios-1" src="https://github.com/user-attachments/assets/ea9417bf-7bf3-4d70-a0e9-b79ff985751a" />
<img width="1920" height="856" alt="NutriCorp — Compatibilidade das refeições" src="https://github.com/user-attachments/assets/79271d7a-cc43-420a-8db3-17733f414731" />

### Fluxo Organização
<img width="1920" height="856" alt="Aplicação Web - Cadastro Usuário-1" src="https://github.com/user-attachments/assets/6b791a92-e19d-4cbe-821d-06fd5f47fc25" />
<img width="1920" height="856" alt="Aplicação Web Administrativa - Tela inicial" src="https://github.com/user-attachments/assets/ae27c3e0-d1bd-41c3-8fd6-76181ddd916d" />
<img width="1920" height="856" alt="NutriCorp — Cadastro de cardápio" src="https://github.com/user-attachments/assets/33c47dbf-3021-4b7e-8f35-c9ece3877c5b" />
<img width="1920" height="856" alt="NutriCorp — Registro de refeições" src="https://github.com/user-attachments/assets/268b7614-d0e9-4a61-9431-d3ad68a9e0b3" />
<img width="1920" height="856" alt="Aplicação Web Administrativa - Cardápios" src="https://github.com/user-attachments/assets/86193a88-fe97-4230-a290-0e19af0a94f5" />
<img width="1920" height="856" alt="Aplicação Web Administrativa - Cardápios-1" src="https://github.com/user-attachments/assets/9c8bee7c-c865-4196-9f7a-6b0c69248ed7" />
<img width="1920" height="856" alt="NutriCorp — Indicadores consolidados" src="https://github.com/user-attachments/assets/c64f7c53-8c59-4fdf-b8be-e933d4590db5" />

## Vídeo Demonstrativo
--- WIP ---

## Intruções de Execução

Requisito: Node.js 20.12 ou superior.

```bash
cd backend
npm install
npm run dev          # API em http://localhost:3333/api (documentação em /api/docs)
```

Em outro terminal:

```bash
cd my-app
npm install
npm run dev          # front-end no endereço indicado pelo Vite
```

Sem `DATABASE_URL`, a API usa dados em memória com uma base de demonstração. Com `DATABASE_URL`, as migrações de `database/migrations` são aplicadas automaticamente. Detalhes em [backend/README.md](backend/README.md).

Contas de demonstração (senha `NutriCorp123!`): `organizacao@nutricorp.dev` (RH), `cozinha@nutricorp.dev` (Cozinha), `colaborador@nutricorp.dev`, `bruno.lima@nutricorp.dev`, `carla.mendes@nutricorp.dev` (acesso desativado) e `diego.rocha@nutricorp.dev` (aguardando aprovação).

### Publicação (Railway)

1. Crie um projeto no Railway com um banco **PostgreSQL** e um serviço a partir deste repositório. O Railway usa os scripts `build` e `start` do `package.json` da raiz.
2. No serviço, defina as variáveis `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `JWT_SECRET` (texto aleatório com 32 caracteres ou mais) e, se quiser os dados de demonstração, `SEED_DEMO=true`.
3. Em *Networking*, gere um domínio público.

## Autores do Projeto
- Ana Rita Fonseca Ferreira
- Cleiton John Wichineski
- Gabriel Henrique Lijenko Silva
- Guilherme Henrique De Souza Vasconcellos
- Gustavo Nascimento Baeta Cancela
- Samara Angelica da Silva
- Vânia Nunes Jaconis

## Licença e Finalidade Acadêmica
<p align="center"> Este projeto possui finalidade exclusivamente acadêmica e foi desenvolvido como parte das atividades da disciplina <br>
<p align="center"> PROJETO INTEGRADOR V: ANÁLISE DE SOLUÇÕES INTEGRADAS PARA ORGANIZAÇÕES <br>
<p align="center"> Curso Análise e Desenvolvimento de Sistemas do Centro Universitário Senac <br>
<p align="center"> Professor Anderson Clayton Garcia Lopes
