-- Renomeia nomes ofensivos conhecidos (mesa/personagem já criados).
-- Idempotente: só altera quando o nome normalizado corresponde.

UPDATE eldarin_adventures
SET
  name = 'Minha paz',
  updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
WHERE lower(trim(name)) = 'minha rola';

UPDATE eldarin_rooms
SET
  name = 'Minha paz',
  scene = jsonb_set(COALESCE(scene, '{}'::jsonb), '{name}', '"Minha paz"'::jsonb, true),
  updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
WHERE lower(trim(name)) = 'minha rola';

UPDATE eldarin_characters
SET
  data = jsonb_set(COALESCE(data, '{}'::jsonb), '{name}', '"Minha paz"'::jsonb, true),
  updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
WHERE lower(trim(data->>'name')) = 'minha rola';
