## Executar o frontend do NutriCorp

1. Inicie o backend em seu próprio diretório com `npm ci` e `npm run dev`. A versão de demonstração usa `http://localhost:3333/api`.
2. No diretório `my-app`, rode `npm ci` e `npm run dev`. Abra o endereço indicado pelo Vite.
3. Para usar outra API, defina `VITE_API_URL` com a URL base completa (incluindo `/api`) em `my-app/.env.local` e reinicie o Vite. A origem do frontend deve estar em `CORS_ORIGIN` do backend.

Com os dados de demonstração da API, use `organizacao@nutricorp.dev` ou `colaborador@nutricorp.dev`, com a senha definida no README do backend. O cadastro de colaborador aceita o CNPJ ou o nome já cadastrado da organização.

O frontend guarda o token e o perfil em `sessionStorage` e valida a sessão com a API quando a página é recarregada. Para cadastrar ou editar um cardápio, abra **Cardápios e Refeições** no menu da organização.

Rode `npm run build` para verificar os tipos e gerar a versão de produção.
