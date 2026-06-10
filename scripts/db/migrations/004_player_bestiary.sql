CREATE TABLE IF NOT EXISTS eldarin_player_bestiary (
  user_id TEXT NOT NULL,
  adventure_id TEXT NOT NULL,
  type_key TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, adventure_id, type_key)
);

CREATE INDEX IF NOT EXISTS eldarin_player_bestiary_adventure
  ON eldarin_player_bestiary (adventure_id, user_id);
