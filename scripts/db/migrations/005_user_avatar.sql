-- Avatar de perfil: OAuth (Clerk) ou foto personalizada
ALTER TABLE eldarin_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE eldarin_users ADD COLUMN IF NOT EXISTS oauth_avatar_url TEXT;
ALTER TABLE eldarin_users ADD COLUMN IF NOT EXISTS avatar_source TEXT NOT NULL DEFAULT 'oauth';
