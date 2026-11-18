# Registro de refeições do colaborador

Na pasta my-app, execute `npm.cmd run dev`. No menu do colaborador, abra Registrar refeição e consultar histórico. A rota é `/#/colaborador/refeicoes`.

Esta tela registra consumo pessoal e está no fluxo do colaborador. Não oferece à organização acesso a históricos alimentares individuais.

## Fluxos

- Data de consumo, tipo de refeição, preparação selecionada e observações opcionais.
- A data inicial considera America/Sao_Paulo. Consumos futuros são rejeitados.
- O tipo filtra as opções e limpa a seleção anterior quando alterado. Tipos sem opções mostram mensagem específica.
- O botão Registrar consumo desta alternativa, na página de compatibilidade, abre o formulário com a alternativa selecionada. A seleção anterior não registra consumo por si só.
- Compatibilidade usa o perfil e restrições marcadas. O aviso de dados insuficientes não é apresentado como garantia de segurança. Observações e orientações livres não são analisadas automaticamente.
- O registro relata o que foi consumido, por isso um alerta de incompatibilidade não impede documentar o consumo ocorrido.
- O resumo usa os nutrientes disponíveis da porção cadastrada. Observações sobre alterações da refeição não recalculam nutrientes. Informação ausente aparece como não disponível, sem assumir zero.

## Histórico e gravação simulada

Há três exemplos fictícios em novembro de 2026, conforme a referência visual. O histórico mostra o mês da data escolhida e ordena os registros pela data de consumo e horário de envio. A coluna Data / registro mostra a data informada para consumo e o horário em que o registro foi enviado, convertido para São Paulo. Não representa um horário de consumo coletado do usuário.

Registrar atualiza o histórico em memória. Durante o envio, campos e botões ficam bloqueados. Após sucesso, o botão permanece bloqueado até que o formulário seja alterado. Uma chave de requisição evita duplicidade no serviço simulado, inclusive em chamadas concorrentes. Em falha, os campos e a chave são mantidos para tentar novamente. Cancelar volta ao menu sem gravar.

Navegar e retornar mantém os novos registros; recarregar ou trocar/cadastrar uma conta reinicia o mock, removendo os novos registros e restaurando os exemplos. Não há persistência em banco nem no armazenamento do navegador.

## Arquivos e integração

- `src/pages/RegistroRefeicoes.tsx`: formulário, histórico e estados.
- `src/services/registrosRefeicoes.ts`: opções, exemplos, consulta e gravação simuladas.
- `src/types/registroRefeicao.ts`: contratos provisórios.
- `src/validation/registroRefeicao.ts`: data e validação do formulário.
- `src/styles/registro-refeicoes.css`: layout responsivo.
- `src/pages/InicioColaborador.tsx`: acesso ao registro pelo menu.
- `src/pages/CompatibilidadeRefeicao.tsx`: acesso com a alternativa pré-selecionada.
- `src/App.tsx`: rota e limpeza dos mocks entre contas.

Alinhar com Gabriel: operações autenticadas para opções e histórico, paginação, data/horário, IDs de preparação, consumo de porções, snapshot nutricional, política de duplicidade e formato dos erros. O servidor deverá identificar o próprio colaborador e aplicar autorização; não confiar em um ID de usuário enviado pelo navegador.

As opções do mock incluem pratos do cardápio e a alternativa de tofu, sem filtrar disponibilidade por data. Todos os dados nutricionais e históricos são fictícios. Não foram adicionadas dependências. Logo e fonte permanecem aproximados até receber os arquivos do Figma.

## Verificação

TypeScript e build de produção passaram. Testados no navegador: acesso pelo menu, campos obrigatórios, data futura, registro atualizando o histórico, recuperação ao voltar, bloqueio após sucesso, compatibilidade incompleta, tipos sem opções, mês sem registros e alternativa pré-selecionada. Chamadas concorrentes com a mesma chave criaram um único registro. Falhas de consulta e gravação foram injetadas nos testes; conferidas nova tentativa e manutenção dos campos. Sem rolagem horizontal nas larguras 320, 768, 1100 e 1440; capturas desktop e celular inspecionadas.
