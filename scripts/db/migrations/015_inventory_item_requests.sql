-- Solicitações de itens no inventário (aprovação do mestre)
CREATE TABLE IF NOT EXISTS eldarin_inventory_item_requests (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  adventure_id TEXT NOT NULL,
  room_id TEXT,
  requester_user_id TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  merge_existing BOOLEAN NOT NULL DEFAULT FALSE,
  instance_id TEXT,
  item_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  gm_user_id TEXT,
  resolved_at BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_eldarin_inventory_item_requests_adventure_status
  ON eldarin_inventory_item_requests (adventure_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_eldarin_inventory_item_requests_character_status
  ON eldarin_inventory_item_requests (character_id, status);
