-- Solicitações de edição de ficha em campanha (aprovação do mestre)
CREATE TABLE IF NOT EXISTS eldarin_sheet_edit_requests (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  adventure_id TEXT NOT NULL,
  room_id TEXT,
  requester_user_id TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('full_rebuild', 'last_level')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'consumed')),
  gm_user_id TEXT,
  resolved_at BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_eldarin_sheet_edit_requests_adventure_status
  ON eldarin_sheet_edit_requests (adventure_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_eldarin_sheet_edit_requests_character_status
  ON eldarin_sheet_edit_requests (character_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_eldarin_sheet_edit_requests_pending_character
  ON eldarin_sheet_edit_requests (character_id)
  WHERE status = 'pending';
