-- Rodar uma vez em bancos já existentes (Neon / Postgres local)
ALTER TABLE eldarin_rooms
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;
