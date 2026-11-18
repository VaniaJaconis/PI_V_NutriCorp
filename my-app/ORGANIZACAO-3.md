# Cadastro de cardápio

Na pasta my-app, execute `npm.cmd run dev`. No menu da organização, abra Cardápios e Refeições. A rota é `/#/organizacao/cardapios`.

## Funcionalidades

Formulário de dados do cardápio, data de oferta, tipo de refeição, organização/unidade, horários, preparações, ingredientes e valores nutricionais. A porção padrão de 450 g e o horário inicial de 11:30 a 14:00 são editáveis. Os demais campos de conteúdo e nutrientes começam vazios. A unidade pode ser preenchida inicialmente com o nome de exibição da organização, mas seu texto ainda não representa um vínculo autorizado.

Alérgenos são declarados pelo responsável em controles próprios. A tela não identifica automaticamente alergênicos a partir de palavras no texto. É necessário revisar e confirmar ingredientes, alérgenos e possíveis traços antes da publicação. Alterar preparações, ingredientes ou alérgenos desmarca a confirmação anterior.

Salvar rascunho permite dados incompletos, exigindo ao menos o nome. Valores preenchidos ainda passam por validação. Publicar exige todos os dados, nutrientes, porção positiva e confirmação da revisão. Nutrientes aceitam zero; valores negativos ou não finitos são rejeitados. O horário final deve ser posterior ao inicial no mesmo dia. Datas anteriores não são bloqueadas, permitindo o exemplo de 10/11/2026 da referência.

O primeiro erro recebe foco. Durante o envio, ambos os botões e os campos ficam bloqueados. Há estado de carregamento, falha com nova tentativa e confirmação. Falhas de gravação mantêm o formulário preenchido. Voltar ao menu sem salvar descarta as edições locais; voltar à tela recupera o último registro salvo.

## Simulação e integração

O serviço mantém um único registro em memória, com estado rascunho ou publicado. Salvar novamente atualiza esse registro. Salvar como rascunho um registro publicado altera seu estado no mock. Recarregar a aplicação ou entrar/cadastrar outra conta limpa a demonstração.

Publicar não faz publicação externa nem atualiza os cardápios fictícios da consulta do colaborador. Essa integração depende dos contratos de unidades, preparações individuais, ingredientes, nutrientes e publicação do back-end. Os valores nutricionais são informados manualmente; a interface não os calcula nem certifica.

## Arquivos

- `src/pages/CadastroCardapio.tsx`: formulário, validações visíveis e estados.
- `src/types/cardapioOrganizacao.ts`: contrato provisório do formulário e registro.
- `src/validation/cardapioOrganizacao.ts`: regras de rascunho e publicação.
- `src/services/cardapiosOrganizacao.ts`: consulta e gravação em memória com pontos de integração.
- `src/styles/cadastro-cardapio.css`: layout responsivo.
- `src/App.tsx`: rota e limpeza dos dados entre contas da demonstração.

Alinhar com Gabriel endpoints, IDs de organização/unidade, estrutura das preparações, códigos de alérgenos, possíveis traços, unidades nutricionais, números e estados de publicação. No mock, os campos numéricos permanecem como strings do formulário; converter explicitamente para números ou ausência no adaptador da API. O servidor deve validar a identidade, autorização e conteúdo. Não tratar a lista visual de alérgenos como catálogo completo para uso real sem validação técnica.

Logo e tipografia seguem aproximados até receber os arquivos do Figma. Não foram adicionadas dependências.

## Verificação

TypeScript e build de produção passaram. No navegador, testados acesso pelo menu, validações, salvamento de rascunho parcial, retorno recuperando o registro, publicação, confirmação dos alérgenos, horários, valores negativos, bloqueio durante envio, nova revisão após edição e limpeza ao recarregar. Falhas de leitura e gravação injetadas nos testes conferiram nova tentativa e manutenção do formulário. Sem rolagem horizontal nas larguras 320, 768, 1100 e 1440. Capturas desktop e celular inspecionadas.
