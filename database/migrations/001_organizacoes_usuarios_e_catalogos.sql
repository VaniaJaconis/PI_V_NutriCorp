CREATE SCHEMA nutricorp;

CREATE TABLE nutricorp.organizacoes (
    id_organizacao bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    razao_social text NOT NULL CHECK (btrim(razao_social) <> ''),
    cnpj varchar(14) NOT NULL UNIQUE CHECK (cnpj ~ '^[0-9]{14}$')
);

CREATE TABLE nutricorp.usuarios (
    id_usuario bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_organizacao bigint NOT NULL REFERENCES nutricorp.organizacoes (id_organizacao),
    nome text NOT NULL CHECK (btrim(nome) <> ''),
    email text NOT NULL CHECK (email = btrim(email) AND email <> ''),
    senha_hash text NOT NULL CHECK (btrim(senha_hash) <> ''),
    papel text NOT NULL CHECK (papel IN ('colaborador', 'cozinha', 'rh')),
    UNIQUE (id_organizacao, id_usuario)
);

CREATE UNIQUE INDEX usuarios_email_unico_idx ON nutricorp.usuarios (lower(email));

CREATE TABLE nutricorp.refeicoes (
    id_refeicao bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_organizacao bigint NOT NULL REFERENCES nutricorp.organizacoes (id_organizacao),
    nome text NOT NULL CHECK (btrim(nome) <> ''),
    descricao text,
    composicao_revisada boolean NOT NULL DEFAULT false,
    UNIQUE (id_organizacao, id_refeicao)
);

CREATE TABLE nutricorp.ingredientes (
    id_ingrediente bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_organizacao bigint NOT NULL REFERENCES nutricorp.organizacoes (id_organizacao),
    nome text NOT NULL CHECK (btrim(nome) <> ''),
    UNIQUE (id_organizacao, id_ingrediente)
);

CREATE TABLE nutricorp.marcadores_alimentares (
    id_marcador bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome text NOT NULL CHECK (btrim(nome) <> '')
);

CREATE UNIQUE INDEX marcadores_nome_unico_idx
    ON nutricorp.marcadores_alimentares (lower(btrim(nome)));
