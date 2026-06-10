-- Avatar focus (crop/zoom) + friend direct messages

ALTER TABLE eldarin_users ADD COLUMN IF NOT EXISTS avatar_focus JSONB;

CREATE TABLE IF NOT EXISTS eldarin_friend_messages (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_friend_messages_pair
  ON eldarin_friend_messages (from_user_id, to_user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_friend_messages_to
  ON eldarin_friend_messages (to_user_id, created_at DESC);
