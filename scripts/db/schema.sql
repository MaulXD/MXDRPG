-- Eldarin VTT — schema Postgres (Neon / local)
-- Run: npm run db:migrate

CREATE TABLE IF NOT EXISTS eldarin_users (
  id TEXT PRIMARY KEY,
  clerk_id TEXT,
  email TEXT NOT NULL,
  nickname TEXT,
  name TEXT NOT NULL,
  password_hash TEXT,
  cpf_prefix_hash TEXT,
  birth_date DATE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at BIGINT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS eldarin_users_email_lower ON eldarin_users (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS eldarin_users_clerk_id ON eldarin_users (clerk_id) WHERE clerk_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS eldarin_users_nickname_lower ON eldarin_users (LOWER(nickname)) WHERE nickname IS NOT NULL;

CREATE TABLE IF NOT EXISTS eldarin_characters (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS eldarin_characters_owner ON eldarin_characters (owner_id);

CREATE TABLE IF NOT EXISTS eldarin_adventures (
  adventure_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  synopsis TEXT NOT NULL DEFAULT '',
  invite_code TEXT NOT NULL,
  member_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  primary_room_id TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  deleted_at BIGINT
);

CREATE UNIQUE INDEX IF NOT EXISTS eldarin_adventures_invite_upper ON eldarin_adventures (UPPER(invite_code));
CREATE INDEX IF NOT EXISTS eldarin_adventures_owner ON eldarin_adventures (owner_id);

CREATE TABLE IF NOT EXISTS eldarin_rooms (
  room_id TEXT PRIMARY KEY,
  adventure_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL,
  member_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  scene JSONB NOT NULL,
  actors JSONB NOT NULL DEFAULT '{}'::jsonb,
  combat JSONB NOT NULL,
  chat JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at BIGINT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS eldarin_rooms_invite_upper ON eldarin_rooms (UPPER(invite_code));
CREATE INDEX IF NOT EXISTS eldarin_rooms_owner ON eldarin_rooms (owner_id);
CREATE INDEX IF NOT EXISTS eldarin_rooms_updated ON eldarin_rooms (updated_at DESC);
