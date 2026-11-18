# Tela inicial de login

Na pasta my-app, execute `npm.cmd run dev` e abra o endereço informado pelo Vite. Sem um caminho específico, a aplicação agora abre Login. A rota explícita é `/#/login`.

## Contas de demonstração

| Usuário | Senha fictícia | Destino |
| --- | --- | --- |
| colaborador | NutriCorp123! | Menu do colaborador |
| organizacao | NutriCorp123! | Área provisória da organização |

Essas contas pertencem apenas ao mock. Os cadastros existentes continuam simulados e não adicionam novas contas ao login. Não use credenciais reais para testar esta versão.

## Comportamento

Campos Usuário e Senha obrigatórios, com foco no primeiro erro e senha mascarada. O botão exibe Entrando durante a operação e os campos e links de cadastro ficam bloqueados para impedir ações concorrentes. Credenciais incorretas geram mensagem; falha de serviço permite nova tentativa. A senha é limpa após falha ou sucesso e não é gravada no navegador ou no console. Uma resposta tardia não redireciona a aplicação caso a tela tenha sido abandonada.

O login simulado recebe o perfil de resposta do serviço e direciona o colaborador ao menu existente ou a organização a um destino provisório, até a próxima tela ser fornecida. O nome é mantido apenas em memória. Entrar com uma conta limpa as preferências e seleções fictícias anteriores, evitando reutilizar dados de outra demonstração.

Links Cadastrar usuário e Cadastrar Organização abrem as rotas existentes. O histórico do navegador permite retornar ao login. As rotas de demonstração anteriores continuam disponíveis diretamente.

## Integração futura

- `src/services/autenticacao.ts`: substituir o mock pela operação de login da API. O servidor valida as credenciais e fornece identidade e perfil; alinhar formato dos erros e gerenciamento da sessão com Gabriel.
- `src/types/autenticacao.ts`: contrato provisório de entrada e resultado.
- `src/pages/Login.tsx`: formulário e estados.
- `src/styles/login.css`: layout da referência.
- `src/pages/InicioOrganizacao.tsx`: destino provisório.
- `src/App.tsx`: rota inicial e direcionamento por perfil.

O mock não cria tokens nem sessão autenticada e não protege acesso por URL. Controle de sessão, autorização em cada endpoint e proteção de rotas deverão ser implementados e testados quando a autenticação real estiver disponível. As credenciais fictícias do serviço não devem permanecer como mecanismo de login na versão de produção.

Logo e fonte continuam aproximados até receber os arquivos do Figma. Não foram adicionadas dependências.

## Verificação

TypeScript e build de produção passaram. No navegador, foram testados login como página inicial, campos obrigatórios, credenciais inválidas, bloqueio durante envio, limpeza da senha, direcionamento dos dois perfis, links para ambos os cadastros, retorno ao login, falha do serviço com nova tentativa disponível e ausência de dados no armazenamento local. Conferidas as larguras 320, 768 e 1440 sem rolagem horizontal; captura de 430 px inspecionada.
