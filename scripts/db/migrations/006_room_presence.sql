-- Presença online na mesa (compartilhada entre instâncias serverless)
CREATE TABLE IF NOT EXISTS eldarin_room_presence (
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Jogador',
  last_seen BIGINT NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_eldarin_room_presence_room_last_seen
  ON eldarin_room_presence (room_id, last_seen DESC);
