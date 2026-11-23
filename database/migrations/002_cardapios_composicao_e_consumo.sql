CREATE TABLE nutricorp.cardapios (
    id_cardapio bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_organizacao bigint NOT NULL REFERENCES nutricorp.organizacoes (id_organizacao),
    data_servico date NOT NULL,
    tipo_servico text NOT NULL CHECK (btrim(tipo_servico) <> ''),
    UNIQUE (id_organizacao, id_cardapio)
);

CREATE TABLE nutricorp.itens_cardapio (
    id_item_cardapio bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_organizacao bigint NOT NULL,
    id_cardapio bigint NOT NULL,
    id_refeicao bigint NOT NULL,
    UNIQUE (id_organizacao, id_item_cardapio),
    UNIQUE (id_organizacao, id_cardapio, id_refeicao),
    FOREIGN KEY (id_organizacao, id_cardapio)
        REFERENCES nutricorp.cardapios (id_organizacao, id_cardapio),
    FOREIGN KEY (id_organizacao, id_refeicao)
        REFERENCES nutricorp.refeicoes (id_organizacao, id_refeicao)
);

CREATE TABLE nutricorp.refeicoes_ingredientes (
    id_organizacao bigint NOT NULL,
    id_refeicao bigint NOT NULL,
    id_ingrediente bigint NOT NULL,
    PRIMARY KEY (id_refeicao, id_ingrediente),
    FOREIGN KEY (id_organizacao, id_refeicao)
        REFERENCES nutricorp.refeicoes (id_organizacao, id_refeicao),
    FOREIGN KEY (id_organizacao, id_ingrediente)
        REFERENCES nutricorp.ingredientes (id_organizacao, id_ingrediente)
);

CREATE TABLE nutricorp.ingredientes_marcadores (
    id_ingrediente bigint NOT NULL REFERENCES nutricorp.ingredientes (id_ingrediente),
    id_marcador bigint NOT NULL REFERENCES nutricorp.marcadores_alimentares (id_marcador),
    PRIMARY KEY (id_ingrediente, id_marcador)
);

CREATE TABLE nutricorp.informacoes_nutricionais (
    id_refeicao bigint PRIMARY KEY REFERENCES nutricorp.refeicoes (id_refeicao),
    porcao_g numeric(8, 2) NOT NULL CHECK (porcao_g > 0 AND porcao_g < 1000000),
    energia_kcal numeric(8, 2) CHECK (energia_kcal >= 0 AND energia_kcal < 1000000),
    carboidratos_g numeric(8, 2) CHECK (carboidratos_g >= 0 AND carboidratos_g < 1000000),
    proteinas_g numeric(8, 2) CHECK (proteinas_g >= 0 AND proteinas_g < 1000000),
    gorduras_g numeric(8, 2) CHECK (gorduras_g >= 0 AND gorduras_g < 1000000),
    CHECK (num_nonnulls(energia_kcal, carboidratos_g, proteinas_g, gorduras_g) > 0)
);

CREATE TABLE nutricorp.perfis_alimentares (
    id_usuario bigint NOT NULL REFERENCES nutricorp.usuarios (id_usuario) ON DELETE CASCADE,
    id_marcador bigint NOT NULL REFERENCES nutricorp.marcadores_alimentares (id_marcador),
    tipo_vinculo text NOT NULL CHECK (tipo_vinculo IN ('preferencia', 'restricao')),
    PRIMARY KEY (id_usuario, id_marcador)
);

CREATE TABLE nutricorp.consumos (
    id_consumo bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_organizacao bigint NOT NULL,
    id_usuario bigint NOT NULL,
    id_item_cardapio bigint NOT NULL,
    consumido_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_organizacao, id_usuario)
        REFERENCES nutricorp.usuarios (id_organizacao, id_usuario),
    FOREIGN KEY (id_organizacao, id_item_cardapio)
        REFERENCES nutricorp.itens_cardapio (id_organizacao, id_item_cardapio)
);

CREATE INDEX cardapios_organizacao_data_idx
    ON nutricorp.cardapios (id_organizacao, data_servico);

CREATE INDEX consumos_usuario_data_idx
    ON nutricorp.consumos (id_organizacao, id_usuario, consumido_em DESC);

CREATE INDEX consumos_item_idx
    ON nutricorp.consumos (id_organizacao, id_item_cardapio);
