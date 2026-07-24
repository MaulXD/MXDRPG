-- Fichas do sistema "O Um Anel" — tabela própria, isolada de eldarin_characters.
CREATE TABLE IF NOT EXISTS um_anel_characters (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL,
  data JSON NOT NULL,
  updated_at BIGINT NOT NULL,
  KEY um_anel_characters_owner (owner_id)
);
