# Tela inicial do colaborador

## Executar

Na pasta my-app, execute `npm.cmd run dev`. Não foram adicionadas dependências.

Abra `http://localhost:5173/#/colaborador` (ou a porta informada pelo Vite) para conferir a tela diretamente. O cadastro continua disponível em `/#/cadastro`. Após o cadastro simulado, a aplicação abre a tela inicial com o nome informado. O nome fica apenas em memória: ao recarregar, a saudação volta a “Nome do Usuário”. Isso ainda não é uma sessão autenticada.

## Rotas

- `/#/cadastro`: cadastro do colaborador.
- `/#/colaborador`: tela inicial com saudação e menu.
- `/#/colaborador/preferencias`: destino provisório de Preferência e Restrições.
- `/#/colaborador/cardapios`: destino provisório de Cardápios.

As rotas usam hash, aceitam navegação voltar/avançar e podem ser abertas diretamente sem configuração de redirecionamentos no servidor. Os destinos provisórios serão substituídos pelas próximas telas fornecidas. Não há chamadas reais à API nem controle de autenticação nesta etapa.

## Arquivos

- `src/App.tsx`: navegação e nome de exibição em memória.
- `src/main.tsx`: montagem de App.
- `src/pages/InicioColaborador.tsx`: tela 2.
- `src/pages/TelaPendente.tsx`: destinos provisórios.
- `src/pages/CadastroColaborador.tsx`: callback ao concluir o cadastro, preservando a mensagem local existente.
- `src/styles/colaborador.css`: estilos da tela 2 e ajuste para celular.

## Integração futura

Substituir o nome em memória pela identidade validada pela API após autenticação. A conclusão do cadastro não deve ser considerada autenticação. Não armazenar senha ou CPF no navegador. O logo e a fonte ainda são aproximações locais até receber os arquivos do Figma.

## Verificação

TypeScript e build de produção concluídos. Testado em navegador o cadastro com dados fictícios seguido da tela inicial, os dois links, voltar, recarregar rota interna e ausência de rolagem horizontal a 320px. Capturas conferidas em desktop e celular.

Esta etapa substitui a descrição antiga do README que dizia que a próxima tela ainda não havia sido fornecida.
