-- Marcação de leitura em mensagens diretas entre amigos

ALTER TABLE eldarin_friend_messages
  ADD COLUMN IF NOT EXISTS read_at BIGINT;

-- Mensagens antigas contam como já lidas
UPDATE eldarin_friend_messages
SET read_at = created_at
WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_friend_messages_unread
  ON eldarin_friend_messages (to_user_id, read_at)
  WHERE read_at IS NULL;
