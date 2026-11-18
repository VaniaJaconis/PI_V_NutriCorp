# Cardápios do colaborador

Na pasta my-app, execute `npm.cmd run dev`. Acesse `/#/colaborador/cardapios` ou use o botão Cardápios do menu. Não foram adicionadas dependências.

## Funcionamento

Quatro colunas: refeições, pratos do cardápio, ingredientes e informações nutricionais. A primeira refeição e o primeiro prato são selecionados ao carregar. Ao trocar a refeição, a seleção do prato é redefinida, impedindo a exibição de ingredientes ou tabela de outra refeição. O botão voltar retorna ao menu do colaborador.

As imagens incluem referências administrativas e botões de adição. Esta implementação pertence ao fluxo do colaborador e oferece consulta. Criação e edição de refeições e pratos ficam para a implementação do perfil responsável pela alimentação.

Existem estados de carregamento, erro com nova tentativa, lista de refeições vazia, refeição sem pratos, ingredientes ausentes e tabela nutricional ausente. Em telas menores as quatro colunas são reorganizadas em duas ou uma coluna.

## Dados e compatibilidade

Todos os cardápios, ingredientes, declarações e valores nutricionais são fictícios para testes. Não representam refeições reais nem referências nutricionais. O exemplo contém arroz branco, frango grelhado, purê e salada; há uma refeição vazia para verificar o estado correspondente.

Os alertas consultam as preferências salvas na página 3. Consideram as restrições selecionadas, declarações simuladas de ingredientes/traços e o perfil alimentar. Dados incompletos geram aviso de confirmação com o serviço de alimentação. Ausência de alerta não garante segurança. Alimentos a evitar e orientações em texto livre não são interpretados automaticamente; essa limitação aparece na interface.

O mock de preferências permanece em memória durante a navegação; recarregar a aplicação apaga as escolhas.

## Integração futura

- `src/services/cardapios.ts`: substituir consultarCardapios por consulta autenticada da organização, alinhando filtros de data e contratos com Gabriel.
- `src/types/cardapio.ts`: contrato provisório para refeições, pratos, ingredientes, declarações e nutrientes, incluindo unidades e porção.
- `src/validation/compatibilidade.ts`: lógica provisória de alertas, a alinhar e validar com os responsáveis técnicos antes de uso real.
- `src/pages/CardapiosColaborador.tsx`: tela e estados de consulta.
- `src/styles/cardapios.css`: layout da página.
- `src/App.tsx`: rota real da página 4.

As declarações de alergênicos/traços devem vir de informações verificadas pelo responsável pelo serviço de alimentação. Não devem ser inferidas a partir dos mocks ou apenas do nome do prato.

## Verificação

TypeScript e compilação de produção concluídos. Testado no navegador o acesso pelo menu, seleção sincronizada, atualização da tabela, dados incompletos, refeição sem pratos, preferências salvas, alertas de lactose, soja/traços e perfil vegetariano, recarga, erro de consulta e nova tentativa com lista vazia. Conferidas as larguras 320, 600, 768, 1100 e 1736 sem rolagem horizontal; capturas de 834 px e celular inspecionadas.

A página substitui o destino provisório de Cardápios descrito na documentação da tela 2.
