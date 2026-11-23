ALTER TABLE nutricorp.usuarios ADD COLUMN aprovado boolean NOT NULL DEFAULT true;

ALTER TABLE nutricorp.preferencias_colaborador ADD COLUMN consentimento_em timestamptz;
