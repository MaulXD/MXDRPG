-- P1: Clerk + nickname (idempotente em DBs já criados)
ALTER TABLE eldarin_users ADD COLUMN IF NOT EXISTS clerk_id TEXT;
ALTER TABLE eldarin_users ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE eldarin_users ALTER COLUMN password_hash DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS eldarin_users_clerk_id ON eldarin_users (clerk_id) WHERE clerk_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS eldarin_users_nickname_lower ON eldarin_users (LOWER(nickname)) WHERE nickname IS NOT NULL;
