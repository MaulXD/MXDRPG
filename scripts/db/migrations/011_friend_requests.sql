-- Pedidos de amizade (aceitar / recusar antes de aparecer na lista)
CREATE TABLE IF NOT EXISTS eldarin_friend_requests (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at BIGINT NOT NULL,
  responded_at BIGINT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_eldarin_friend_requests_pending_pair
  ON eldarin_friend_requests (from_user_id, to_user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_eldarin_friend_requests_to_pending
  ON eldarin_friend_requests (to_user_id, created_at DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_eldarin_friend_requests_from_pending
  ON eldarin_friend_requests (from_user_id, created_at DESC)
  WHERE status = 'pending';
