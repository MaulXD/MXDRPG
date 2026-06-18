-- OAuth manual (Google / Discord) — identidade externa
ALTER TABLE eldarin_users ADD COLUMN IF NOT EXISTS oauth_provider TEXT;
ALTER TABLE eldarin_users ADD COLUMN IF NOT EXISTS oauth_subject TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS eldarin_users_oauth_identity
  ON eldarin_users (oauth_provider, oauth_subject)
  WHERE oauth_provider IS NOT NULL AND oauth_subject IS NOT NULL;
