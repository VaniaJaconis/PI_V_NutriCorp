## Integração com o backend

Os locais de integração estão comentados em `src/services/`, indicando a operação que deve ser conectada ao backend. 

Confirmar os contratos de autenticação, organizações, colaboradores, preferências, cardápios, alternativas e registros. A API deve validar os dados, a sessão e as permissões, inclusive o acesso ao histórico individual. Os tipos em `src/types/` devem acompanhar esses contratos.

No cadastro de cardápio, converter os valores numéricos do formulário para o formato esperado pela API e substituir o texto da unidade por um identificador autorizado. Publicar no serviço simulado ainda não atualiza a consulta do colaborador.

O registro de consumo utiliza uma chave para evitar envios duplicados. Manter esse controle no backend. Os valores nutricionais correspondem à porção cadastrada; observações livres não recalculam nutrientes.
