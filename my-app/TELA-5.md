# Compatibilidade das refeições

Na pasta my-app, execute `npm.cmd run dev`. Em Cardápios, escolha uma refeição e clique em Ver compatibilidade da refeição. Para reproduzir o exemplo visual, escolha Almoço vegetariano e salve anteriormente o perfil Vegetariana com restrição Lactose na página 3.

## Rotas e fluxo

- `/#/colaborador/compatibilidade?refeicao=terca-vegetariano`: exemplo da imagem, com data demonstrativa 10/11/2026.
- O parâmetro refeicao identifica a refeição real selecionada na página 4. Sem parâmetro, a demonstração usa o exemplo vegetariano.
- Voltar aos cardápios mantém a refeição selecionada por meio do parâmetro na rota.
- Revisar meu perfil abre a página 3; o botão Voltar do navegador permite retornar à comparação com as preferências atualizadas.

## Comportamento

O quadro de preparações utiliza a mesma avaliação provisória da página 4. Incompatibilidades, possíveis traços e informações incompletas são apresentados conforme os dados e o perfil salvo. O aviso sobre lactose só aparece quando essa restrição foi marcada. Nenhuma condição de saúde é preenchida automaticamente.

A alternativa também é comparada com o perfil. O exemplo de tofu contém soja e fica bloqueado quando houver essa restrição. A seleção é revalidada no serviço simulado, confirmada na tela e mantida em memória durante a navegação. O botão fica bloqueado durante a operação e após a confirmação. Se o perfil mudar e invalidar uma seleção anterior, o sistema mostra a necessidade de revisão.

Selecionar alternativa não registra consumo nem faz reserva. A seleção e os dados do perfil são apagados ao recarregar a aplicação ou concluir um novo cadastro. A implementação não autentica o usuário.

Há tratamento de carregamento, erro com nova tentativa, refeição inválida, refeição sem preparações, ausência de alternativa e falha de seleção. Textos livres de alimentos a evitar e orientações não são avaliados automaticamente.

Todos os ingredientes, declarações e valores nutricionais são fictícios. O exemplo visual de 450 g, 580 kcal e 24 g de proteínas é demonstrativo. A marca e a fonte continuam aproximadas até receber os arquivos do Figma.

## Arquivos e integração futura

- `src/pages/CompatibilidadeRefeicao.tsx`: página 5 e estados.
- `src/services/alternativas.ts`: consulta e seleção simuladas; substituir por operações autenticadas da API, validando vínculo à organização, disponibilidade, perfil atualizado e duplicidade.
- `src/mocks/almocoVegetariano.ts`: dados da demonstração e alternativa.
- `src/styles/compatibilidade.css`: apresentação responsiva.
- `src/services/cardapios.ts`: inclui a refeição de exemplo no menu.
- `src/pages/CardapiosColaborador.tsx`: link para a avaliação e recuperação da refeição ao voltar.
- `src/App.tsx`: suporte ao parâmetro da rota e limpeza da seleção ao cadastrar novo colaborador.

Alinhar com Gabriel o contrato de alternativas, IDs, método de seleção, resultado, erros e origem dos dados. A avaliação nutricional e os critérios devem ser validados pelos responsáveis técnicos antes do uso real.

## Verificação

TypeScript e build Vite passaram. Testados no navegador: fluxo 3 → 4 → 5, incompatibilidade com lactose, seleção e bloqueio de duplicidade, manutenção em memória, retorno à refeição, revisão do perfil com soja bloqueando tofu, refeição vazia, ID inválido, recarga e quatro larguras sem rolagem horizontal. Falhas de consulta e seleção foram injetadas somente nos testes para conferir nova tentativa e recuperação. Capturas desktop e celular inspecionadas.
