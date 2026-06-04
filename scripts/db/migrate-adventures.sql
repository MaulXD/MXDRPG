-- Aventura como container (mesa + fichas + membros)
CREATE TABLE IF NOT EXISTS eldarin_adventures (
  adventure_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  synopsis TEXT NOT NULL DEFAULT '',
  invite_code TEXT NOT NULL,
  member_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  primary_room_id TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS eldarin_adventures_invite_upper ON eldarin_adventures (UPPER(invite_code));

ALTER TABLE eldarin_rooms
  ADD COLUMN IF NOT EXISTS adventure_id TEXT;

UPDATE eldarin_rooms SET adventure_id = room_id WHERE adventure_id IS NULL;

-- Backfill aventuras a partir de salas existentes
INSERT INTO eldarin_adventures (
  adventure_id, owner_id, name, synopsis, invite_code, member_ids,
  primary_room_id, created_at, updated_at
)
SELECT
  room_id, owner_id, name, '', invite_code, member_ids,
  room_id, updated_at, updated_at
FROM eldarin_rooms
ON CONFLICT (adventure_id) DO NOTHING;
