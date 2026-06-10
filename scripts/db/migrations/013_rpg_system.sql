-- Vincula cada aventura/mesa a um RPG do hub MXDRPG. Legado = Eldarin.
ALTER TABLE eldarin_adventures ADD COLUMN IF NOT EXISTS rpg_system TEXT NOT NULL DEFAULT 'eldarin';

UPDATE eldarin_adventures
SET rpg_system = 'eldarin'
WHERE rpg_system IS NULL OR TRIM(rpg_system) = '';

CREATE INDEX IF NOT EXISTS idx_eldarin_adventures_rpg_system
  ON eldarin_adventures (rpg_system, updated_at DESC);
