# Menu da organização

Na pasta my-app, execute `npm.cmd run dev`. Acesse `/#/organizacao` diretamente ou entre na tela inicial com usuário `organizacao` e senha fictícia `NutriCorp123!`.

## Fluxos

- Login da conta de demonstração abre o menu com o nome retornado pelo mock.
- Concluir o cadastro simulado da organização agora abre o menu com o nome fantasia informado. Isso substitui a confirmação isolada da etapa anterior e não cria uma conta real ou sessão autenticada.
- Acesso direto ou recarga usa Nome do Usuário como saudação genérica, pois o nome fica apenas em memória.
- Controle de Acesso aponta para `/#/organizacao/acessos`.
- Cardápios e Refeições aponta para `/#/organizacao/cardapios`.
- Indicadores aponta para `/#/organizacao/indicadores`.

Os três destinos são provisórios e mostram a indicação de que estarão disponíveis em breve, com retorno ao menu da organização. As funcionalidades serão implementadas conforme os próximos layouts. A navegação não altera dados.

O menu reorganiza os botões verticalmente no celular. Os links têm foco de teclado e podem ser acionados com Enter. Logo e fonte continuam aproximados até receber os arquivos do Figma.

## Arquivos

- `src/pages/InicioOrganizacao.tsx`: menu conforme referência.
- `src/styles/inicio-organizacao.css`: layout responsivo.
- `src/pages/OrganizacaoPendente.tsx`: destinos temporários específicos da organização.
- `src/pages/CadastroOrganizacao.tsx`: callback com nome fantasia após sucesso.
- `src/App.tsx`: rotas, títulos e conexão com o cadastro.

Não foram adicionadas dependências ou operações reais de API. O controle de acesso ainda depende da integração de autenticação e autorização com o back-end. Não interpretar a entrada após cadastro como autenticação real.

## Verificação

TypeScript e build de produção passaram. Testados menu, três destinos, recarga de rota interna, retorno, histórico do navegador, acionamento por teclado, login da organização e cadastro com nome fantasia. Sem rolagem horizontal a 320, 768, 1100 e 1440 px; capturas de 1319 px e celular inspecionadas.
