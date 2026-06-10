ALTER TABLE eldarin_adventures ADD COLUMN IF NOT EXISTS access_mode TEXT NOT NULL DEFAULT 'public';

CREATE TABLE IF NOT EXISTS eldarin_adventure_join_tokens (
  id TEXT PRIMARY KEY,
  adventure_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_by TEXT NOT NULL,
  used_by TEXT,
  used_at BIGINT,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS eldarin_adventure_join_requests (
  id TEXT PRIMARY KEY,
  adventure_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at BIGINT NOT NULL,
  responded_at BIGINT,
  responded_by TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_join_requests_pending_user
  ON eldarin_adventure_join_requests (adventure_id, user_id) WHERE status = 'pending';
