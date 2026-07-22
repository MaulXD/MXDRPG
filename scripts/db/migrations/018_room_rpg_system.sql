-- Copia o sistema de RPG da aventura pra mesa (evita fetch extra em toda ação de combate). Legado = Eldarin.
ALTER TABLE eldarin_rooms ADD COLUMN IF NOT EXISTS rpg_system TEXT NOT NULL DEFAULT 'eldarin';

UPDATE eldarin_rooms
SET rpg_system = 'eldarin'
WHERE rpg_system IS NULL OR TRIM(rpg_system) = '';
