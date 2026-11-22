# Banco de dados do NutriCorp

O PostgreSQL armazena as 12 tabelas do MVP no esquema `nutricorp`. Consulte a [modelagem de dados e o DER](../docs/modelagem-de-dados.md) para entender os relacionamentos.

## Aplicar as migrações

Use um servidor PostgreSQL em execução, com o cliente `psql` disponível. Execute os comandos a partir da raiz do repositório, com uma conta que possa criar o banco e seu esquema. Ajuste o usuário, o host e a porta à configuração local.

```text
createdb -h localhost -U postgres nutricorp
psql -X -h localhost -U postgres -d nutricorp -v ON_ERROR_STOP=1 --single-transaction -f database/migrations/001_organizacoes_usuarios_e_catalogos.sql -f database/migrations/002_cardapios_composicao_e_consumo.sql
```

Pule o primeiro comando se já tiver um banco vazio para o projeto. A primeira migração cria o esquema, os cadastros e os catálogos. A segunda cria cardápios, composição, informações nutricionais, perfis alimentares e consumo. O comando aplica as duas migrações em uma transação e reverte a operação em caso de erro. Execute essa sequência uma vez por banco. Para evoluir um banco existente, adicione uma migração numerada e aplique somente a versão nova. [Documentação do psql](https://www.postgresql.org/docs/18/app-psql.html)

Para conferir as tabelas criadas, execute:

```text
psql -X -h localhost -U postgres -d nutricorp -c "\dt nutricorp.*"
```

## Integração com o back-end

- O cadastro deve guardar apenas o hash da senha e validar o CNPJ. A migração verifica o formato de 14 dígitos e a unicidade do CNPJ.
- O back-end deve autorizar cada operação pelo papel e pela organização do usuário autenticado. As chaves compostas barram vínculos entre organizações, e as consultas também devem filtrar o acesso pela organização.
- Ao editar a composição de um prato ou os marcadores de seus ingredientes, volte a sinalizar a composição afetada como pendente de revisão. Use marcadores de restrição para detectar conflitos e deixe os indicadores destinados a RH e cozinha em nível agregado.
