# Preferências e restrições alimentares

Abra `/#/colaborador/preferencias` na aplicação ou use o botão Preferência e Restrições da tela 2. Na pasta my-app, execute `npm.cmd run dev`. Não há novas dependências.

## Comportamento

- Um perfil alimentar por vez: Sem preferência, Vegetariana, Vegana ou Pescetariana.
- Múltiplas restrições: Lactose, Glúten, Amendoim, Castanhas, Ovo e Soja.
- Textos opcionais para alimentos a evitar (até 500 caracteres) e orientações (até 1000). Limites provisórios a alinhar com o back-end.
- Começa sem restrições e com Sem preferência. Os dados ilustrados na imagem não são aplicados automaticamente ao usuário.
- Salvar mantém as escolhas no serviço simulado em memória e exibe confirmação; a tela permanece aberta para permitir novas edições ou retorno pelo botão Cancelar.
- Cancelar volta ao menu e descarta alterações ainda não salvas.
- Ao reabrir a tela, as últimas escolhas salvas são carregadas. Ao recarregar a aplicação ou concluir um novo cadastro, os dados simulados são apagados.
- Carregamento, gravação, erros e nova tentativa implementados. Os controles ficam bloqueados durante a gravação para evitar duplicidade.

## Arquivos da atualização

- `src/App.tsx`: rota real e limpeza do mock ao concluir novo cadastro.
- `src/pages/PreferenciasColaborador.tsx`: formulário e estados.
- `src/services/preferencias.ts`: leitura e gravação simuladas.
- `src/types/preferencias.ts`: tipos do contrato provisório.
- `src/styles/preferencias.css`: layout responsivo baseado na imagem.

## Integração futura

Substituir as funções consultarPreferencias e salvarPreferencias por chamadas autenticadas da API. Alinhar endpoint, método, códigos das opções, limites e formato dos erros com Gabriel. O servidor deve validar a identidade e as permissões. O serviço simulado não envia dados, não usa armazenamento do navegador nem representa persistência real.

A página distingue preferências de restrições e alerta para conferir ingredientes e possíveis traços. A lógica de compatibilidade do cardápio será conectada posteriormente. Logo e fontes seguem como aproximações até receber os arquivos do Figma.

## Verificação

TypeScript e compilação Vite passaram. Verificados no navegador: navegação a partir do menu, seleção exclusiva de perfil, múltiplas restrições e desmarcação, salvar, bloqueio durante envio, Cancelar descartando edição, recuperação de dados salvos e limpeza ao recarregar. Falhas de leitura e gravação foram injetadas apenas no teste: confirmadas nova tentativa e manutenção dos valores após erro. Sem rolagem horizontal nas larguras 320, 768, 1100 e 1440. Capturas desktop e celular inspecionadas.
