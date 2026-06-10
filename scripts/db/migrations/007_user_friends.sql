-- Amigos (por apelido) e convites de mesa enviados entre usuários
CREATE TABLE IF NOT EXISTS eldarin_user_friends (
  user_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_eldarin_user_friends_friend
  ON eldarin_user_friends (friend_id);

CREATE TABLE IF NOT EXISTS eldarin_mesa_invites (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  adventure_id TEXT NOT NULL,
  invite_code TEXT NOT NULL,
  room_name TEXT NOT NULL,
  message TEXT,
  created_at BIGINT NOT NULL,
  dismissed_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_eldarin_mesa_invites_to_user
  ON eldarin_mesa_invites (to_user_id, created_at DESC);
