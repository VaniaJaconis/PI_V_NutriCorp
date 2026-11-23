ALTER TABLE nutricorp.organizacoes
    DROP CONSTRAINT organizacoes_cnpj_check,
    ADD CONSTRAINT organizacoes_cnpj_check CHECK (cnpj ~ '^[A-Z0-9]{12}[0-9]{2}$'),
    ADD COLUMN nome_fantasia text NOT NULL DEFAULT '',
    ADD COLUMN setor text NOT NULL DEFAULT '',
    ADD COLUMN criado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE nutricorp.usuarios
    ADD COLUMN cpf varchar(11) CHECK (cpf ~ '^[0-9]{11}$'),
    ADD COLUMN setor text,
    ADD COLUMN codigo_funcionario text,
    ADD COLUMN ativo boolean NOT NULL DEFAULT true,
    ADD COLUMN criado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD CHECK (papel <> 'colaborador' OR (cpf IS NOT NULL AND codigo_funcionario IS NOT NULL));

CREATE UNIQUE INDEX usuarios_cpf_unico_idx ON nutricorp.usuarios (cpf);
CREATE UNIQUE INDEX usuarios_codigo_unico_idx ON nutricorp.usuarios (id_organizacao, codigo_funcionario);

ALTER TABLE nutricorp.marcadores_alimentares
    ADD COLUMN codigo text UNIQUE,
    ADD COLUMN categoria text CHECK (categoria IN ('alergeno', 'perfil'));

INSERT INTO nutricorp.marcadores_alimentares (nome, codigo, categoria) VALUES
    ('Lactose', 'lactose', 'alergeno'),
    ('Glúten', 'gluten', 'alergeno'),
    ('Amendoim', 'amendoim', 'alergeno'),
    ('Castanhas', 'castanhas', 'alergeno'),
    ('Ovo', 'ovo', 'alergeno'),
    ('Soja', 'soja', 'alergeno'),
    ('Vegetariana', 'vegetariana', 'perfil'),
    ('Vegana', 'vegana', 'perfil'),
    ('Pescetariana', 'pescetariana', 'perfil');

CREATE TABLE nutricorp.preferencias_colaborador (
    id_usuario bigint PRIMARY KEY REFERENCES nutricorp.usuarios (id_usuario) ON DELETE CASCADE,
    alimentos_evitar text NOT NULL DEFAULT '',
    outras_orientacoes text NOT NULL DEFAULT '',
    atualizado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX ingredientes_nome_unico_idx
    ON nutricorp.ingredientes (id_organizacao, lower(btrim(nome)));

ALTER TABLE nutricorp.refeicoes_ingredientes ADD COLUMN ordem smallint NOT NULL DEFAULT 0;

CREATE TABLE nutricorp.refeicoes_marcadores (
    id_refeicao bigint NOT NULL REFERENCES nutricorp.refeicoes (id_refeicao) ON DELETE CASCADE,
    id_marcador bigint NOT NULL REFERENCES nutricorp.marcadores_alimentares (id_marcador),
    tipo_vinculo text NOT NULL CHECK (tipo_vinculo IN ('contem', 'pode_conter', 'adequada')),
    PRIMARY KEY (id_refeicao, id_marcador, tipo_vinculo)
);

ALTER TABLE nutricorp.informacoes_nutricionais
    ALTER COLUMN porcao_g DROP NOT NULL,
    DROP CONSTRAINT informacoes_nutricionais_check,
    ADD COLUMN sodio_mg numeric(8, 2) CHECK (sodio_mg >= 0 AND sodio_mg < 1000000);

ALTER TABLE nutricorp.cardapios
    ALTER COLUMN data_servico DROP NOT NULL,
    ALTER COLUMN tipo_servico DROP NOT NULL,
    ADD CHECK (tipo_servico IN ('Café da manhã', 'Almoço', 'Lanche', 'Jantar')),
    ADD COLUMN estado text NOT NULL DEFAULT 'rascunho' CHECK (estado IN ('rascunho', 'publicado')),
    ADD COLUMN unidade text NOT NULL DEFAULT '',
    ADD COLUMN horario_inicio time,
    ADD COLUMN horario_fim time,
    ADD COLUMN criado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN atualizado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN publicado_em timestamptz,
    ADD CHECK (estado = 'rascunho' OR (data_servico IS NOT NULL AND tipo_servico IS NOT NULL));

ALTER TABLE nutricorp.consumos
    ALTER COLUMN id_item_cardapio DROP NOT NULL,
    DROP CONSTRAINT consumos_id_organizacao_id_item_cardapio_fkey,
    ADD FOREIGN KEY (id_organizacao, id_item_cardapio)
        REFERENCES nutricorp.itens_cardapio (id_organizacao, id_item_cardapio)
        ON DELETE SET NULL (id_item_cardapio),
    ADD COLUMN requisicao_id text NOT NULL,
    ADD COLUMN data_consumo date NOT NULL,
    ADD COLUMN tipo_refeicao text NOT NULL,
    ADD COLUMN nome_refeicao text NOT NULL,
    ADD COLUMN energia_kcal numeric(8, 2),
    ADD COLUMN observacoes text NOT NULL DEFAULT '',
    ADD COLUMN situacao text NOT NULL CHECK (situacao IN ('compativel', 'parcial', 'incompativel')),
    ADD COLUMN registrado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD UNIQUE (id_usuario, requisicao_id);

CREATE INDEX consumos_organizacao_data_idx ON nutricorp.consumos (id_organizacao, data_consumo);

CREATE TABLE nutricorp.selecoes_alternativas (
    id_usuario bigint NOT NULL REFERENCES nutricorp.usuarios (id_usuario) ON DELETE CASCADE,
    id_cardapio bigint NOT NULL REFERENCES nutricorp.cardapios (id_cardapio) ON DELETE CASCADE,
    id_cardapio_alternativa bigint NOT NULL REFERENCES nutricorp.cardapios (id_cardapio) ON DELETE CASCADE,
    selecionado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_cardapio)
);
