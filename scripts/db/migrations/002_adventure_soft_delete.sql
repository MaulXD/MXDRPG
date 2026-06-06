ALTER TABLE eldarin_adventures
  ADD COLUMN IF NOT EXISTS deleted_at BIGINT;

CREATE INDEX IF NOT EXISTS eldarin_adventures_deleted ON eldarin_adventures (deleted_at)
  WHERE deleted_at IS NOT NULL;
