# Cadastro da organização

Na pasta my-app, execute `npm.cmd run dev` e abra `/#/organizacao/cadastro` no endereço informado. A rota inicial padrão permanece o cadastro do colaborador. Não foram adicionadas dependências.

## Tela e estados

Campos conforme a imagem: Razão Social, CNPJ, Nome Fantasia, Setor, E-mail de comunicação e Senha. Todos são obrigatórios nesta versão. As regras de obrigatoriedade e limites devem ser alinhadas com o contrato da API.

Há máscara e validação dos dígitos de CNPJ, validação de e-mail e senha com mínimo provisório de oito caracteres. As mensagens aparecem ao sair do campo ou enviar; o envio foca o primeiro campo inválido. Durante o envio os controles são bloqueados, com prevenção de duplicidade. A falha mantém os valores para nova tentativa. No sucesso os valores são apagados e uma confirmação explícita da simulação é exibida.

Ainda não há tela seguinte definida para a organização: a confirmação permite voltar ao formulário. O cadastro não cria sessão autenticada. Não há envio real nem armazenamento local dos dados.

## CNPJ

O campo aceita CNPJ numérico e alfanumérico, normaliza letras para maiúsculas e mantém os dois dígitos verificadores numéricos. O valor enviado ao serviço é uma string sem pontuação. O cálculo usa módulo 11 e o valor ASCII menos 48 conforme o manual técnico da Receita Federal:

https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf

Essa verificação detecta inconsistências no formato e nos dígitos; não consulta existência, situação cadastral ou titularidade da organização.

## Arquivos e integração

- `src/pages/CadastroOrganizacao.tsx`: formulário e estados.
- `src/types/organizacao.ts`: contrato provisório.
- `src/validation/organizacao.ts`: CNPJ e validações.
- `src/services/organizacoes.ts`: serviço simulado; substituir pela operação de cadastro da API.
- `src/styles/organizacao.css`: estilos específicos.
- `src/App.tsx`: rota da organização.

Alinhar com Gabriel: endpoint, campos e limites, obrigatoriedade do nome fantasia, política de senhas, aceitação de CNPJ alfanumérico, erros de validação e duplicidade e fluxo após cadastrar. Validar tudo novamente no servidor. Não registrar senha no console ou persistir os dados do formulário no navegador. O mock apenas espera e devolve um ID aleatório, sem guardar os dados.

Logo e tipografia seguem aproximados até receber os arquivos do Figma.

## Verificação

TypeScript e build de produção passaram. Testados no navegador: seis campos obrigatórios, foco do primeiro erro, máscara, CNPJ numérico e exemplo alfanumérico do manual, dígitos inválidos, repetição de zeros e letras indevidas nos verificadores. Conferidos e-mail, senha, envio, bloqueio, sucesso, limpeza, falha com manutenção dos campos e nova tentativa. Testada normalização do CNPJ antes da chamada ao serviço. Sem rolagem horizontal a 320, 768 e 1440 px. Cadastro do colaborador permanece acessível; captura de 498 px inspecionada.
