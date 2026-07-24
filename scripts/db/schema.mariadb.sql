-- Eldarin VTT — schema MariaDB (Contabo / local)
-- Run: DB_DIALECT=mariadb npm run db:migrate

CREATE TABLE IF NOT EXISTS eldarin_users (
  id VARCHAR(64) PRIMARY KEY,
  clerk_id VARCHAR(128) NULL,
  email VARCHAR(320) NOT NULL,
  nickname VARCHAR(64) NULL,
  name VARCHAR(80) NOT NULL,
  password_hash TEXT NULL,
  cpf_prefix_hash VARCHAR(128) NULL,
  birth_date DATE NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'member',
  avatar_url TEXT NULL,
  oauth_avatar_url TEXT NULL,
  avatar_source VARCHAR(32) DEFAULT 'oauth',
  avatar_focus JSON NULL,
  oauth_provider VARCHAR(32) NULL,
  oauth_subject VARCHAR(256) NULL,
  created_at BIGINT NOT NULL,
  nick_lower VARCHAR(64) GENERATED ALWAYS AS (IF(nickname IS NOT NULL, LOWER(nickname), NULL)) STORED,
  oauth_key VARCHAR(512) GENERATED ALWAYS AS (
    IF(oauth_provider IS NOT NULL AND oauth_subject IS NOT NULL,
       CONCAT(oauth_provider, CHAR(0), oauth_subject), NULL)
  ) STORED,
  UNIQUE KEY eldarin_users_email_lower (email),
  UNIQUE KEY eldarin_users_clerk_id (clerk_id),
  UNIQUE KEY eldarin_users_nickname_lower (nick_lower),
  UNIQUE KEY eldarin_users_oauth_identity (oauth_key)
);

CREATE TABLE IF NOT EXISTS eldarin_characters (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL,
  data JSON NOT NULL,
  updated_at BIGINT NOT NULL,
  KEY eldarin_characters_owner (owner_id)
);

-- Fichas do sistema "O Um Anel" — tabela própria, nunca mistura com
-- eldarin_characters (formatos de dados incompatíveis).
CREATE TABLE IF NOT EXISTS um_anel_characters (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL,
  data JSON NOT NULL,
  updated_at BIGINT NOT NULL,
  KEY um_anel_characters_owner (owner_id)
);

CREATE TABLE IF NOT EXISTS eldarin_adventures (
  adventure_id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL,
  name VARCHAR(200) NOT NULL,
  synopsis TEXT NOT NULL,
  rpg_system VARCHAR(64) NOT NULL DEFAULT 'eldarin',
  access_mode VARCHAR(32) NOT NULL DEFAULT 'public',
  invite_code VARCHAR(32) NOT NULL,
  member_ids JSON NOT NULL,
  primary_room_id VARCHAR(64) NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  deleted_at BIGINT NULL,
  invite_upper VARCHAR(32) GENERATED ALWAYS AS (UPPER(invite_code)) STORED,
  UNIQUE KEY eldarin_adventures_invite_upper (invite_upper),
  KEY eldarin_adventures_owner (owner_id),
  KEY idx_eldarin_adventures_rpg_system (rpg_system, updated_at)
);

CREATE TABLE IF NOT EXISTS eldarin_rooms (
  room_id VARCHAR(64) PRIMARY KEY,
  adventure_id VARCHAR(64) NOT NULL,
  owner_id VARCHAR(64) NOT NULL,
  name VARCHAR(200) NOT NULL,
  rpg_system VARCHAR(64) NOT NULL DEFAULT 'eldarin',
  invite_code VARCHAR(32) NOT NULL,
  member_ids JSON NOT NULL,
  scene JSON NOT NULL,
  actors JSON NOT NULL,
  combat JSON NOT NULL,
  chat JSON NOT NULL,
  settings JSON NOT NULL,
  revision INT NOT NULL DEFAULT 1,
  updated_at BIGINT NOT NULL,
  invite_upper VARCHAR(32) GENERATED ALWAYS AS (UPPER(invite_code)) STORED,
  UNIQUE KEY eldarin_rooms_invite_upper (invite_upper),
  KEY eldarin_rooms_owner (owner_id),
  KEY eldarin_rooms_updated (updated_at)
);

-- Upgrade incremental pra bancos existentes (fresh installs já ganham a coluna no CREATE TABLE acima).
ALTER TABLE eldarin_rooms ADD COLUMN IF NOT EXISTS rpg_system VARCHAR(64) NOT NULL DEFAULT 'eldarin';

CREATE TABLE IF NOT EXISTS eldarin_player_bestiary (
  user_id VARCHAR(64) NOT NULL,
  adventure_id VARCHAR(64) NOT NULL,
  type_key VARCHAR(128) NOT NULL,
  data JSON NOT NULL,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, adventure_id, type_key),
  KEY eldarin_player_bestiary_adventure (adventure_id, user_id)
);

CREATE TABLE IF NOT EXISTS eldarin_room_presence (
  room_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  display_name VARCHAR(120) NOT NULL DEFAULT 'Jogador',
  last_seen BIGINT NOT NULL,
  PRIMARY KEY (room_id, user_id),
  KEY idx_eldarin_room_presence_room_last_seen (room_id, last_seen)
);

CREATE TABLE IF NOT EXISTS eldarin_sheet_edit_requests (
  id VARCHAR(64) PRIMARY KEY,
  character_id VARCHAR(64) NOT NULL,
  adventure_id VARCHAR(64) NOT NULL,
  room_id VARCHAR(64) NULL,
  requester_user_id VARCHAR(64) NOT NULL,
  scope VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  gm_user_id VARCHAR(64) NULL,
  resolved_at BIGINT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  pending_slot VARCHAR(64) GENERATED ALWAYS AS (IF(status = 'pending', character_id, NULL)) STORED,
  KEY idx_eldarin_sheet_edit_requests_adventure_status (adventure_id, status, created_at),
  KEY idx_eldarin_sheet_edit_requests_character_status (character_id, status),
  UNIQUE KEY idx_eldarin_sheet_edit_requests_pending_character (pending_slot),
  CONSTRAINT eldarin_sheet_edit_requests_scope_check CHECK (scope IN ('full_rebuild', 'last_level')),
  CONSTRAINT eldarin_sheet_edit_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'consumed'))
);

CREATE TABLE IF NOT EXISTS eldarin_user_friends (
  user_id VARCHAR(64) NOT NULL,
  friend_id VARCHAR(64) NOT NULL,
  created_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, friend_id),
  KEY idx_eldarin_user_friends_friend (friend_id)
);

CREATE TABLE IF NOT EXISTS eldarin_mesa_invites (
  id VARCHAR(64) PRIMARY KEY,
  from_user_id VARCHAR(64) NOT NULL,
  to_user_id VARCHAR(64) NOT NULL,
  room_id VARCHAR(64) NOT NULL,
  adventure_id VARCHAR(64) NOT NULL,
  invite_code VARCHAR(32) NOT NULL,
  room_name VARCHAR(200) NOT NULL,
  message TEXT NULL,
  created_at BIGINT NOT NULL,
  dismissed_at BIGINT NULL,
  KEY idx_eldarin_mesa_invites_to_user (to_user_id, created_at)
);

CREATE TABLE IF NOT EXISTS eldarin_friend_messages (
  id VARCHAR(64) PRIMARY KEY,
  from_user_id VARCHAR(64) NOT NULL,
  to_user_id VARCHAR(64) NOT NULL,
  body TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  read_at BIGINT NULL,
  KEY idx_friend_messages_pair (from_user_id, to_user_id, created_at),
  KEY idx_friend_messages_to (to_user_id, created_at),
  KEY idx_friend_messages_unread (to_user_id, read_at)
);

CREATE TABLE IF NOT EXISTS eldarin_adventure_join_tokens (
  id VARCHAR(64) PRIMARY KEY,
  adventure_id VARCHAR(64) NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  used_by VARCHAR(64) NULL,
  used_at BIGINT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS eldarin_adventure_join_requests (
  id VARCHAR(64) PRIMARY KEY,
  adventure_id VARCHAR(64) NOT NULL,
  room_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  message TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at BIGINT NOT NULL,
  responded_at BIGINT NULL,
  responded_by VARCHAR(64) NULL,
  pending_pair VARCHAR(128) GENERATED ALWAYS AS (IF(status = 'pending', CONCAT(adventure_id, CHAR(0), user_id), NULL)) STORED,
  UNIQUE KEY idx_join_requests_pending_user (pending_pair)
);

CREATE TABLE IF NOT EXISTS eldarin_friend_requests (
  id VARCHAR(64) PRIMARY KEY,
  from_user_id VARCHAR(64) NOT NULL,
  to_user_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at BIGINT NOT NULL,
  responded_at BIGINT NULL,
  pending_pair VARCHAR(128) GENERATED ALWAYS AS (IF(status = 'pending', CONCAT(from_user_id, CHAR(0), to_user_id), NULL)) STORED,
  UNIQUE KEY idx_eldarin_friend_requests_pending_pair (pending_pair),
  KEY idx_eldarin_friend_requests_to_pending (to_user_id, created_at),
  KEY idx_eldarin_friend_requests_from_pending (from_user_id, created_at)
);

CREATE TABLE IF NOT EXISTS eldarin_inventory_item_requests (
  id VARCHAR(64) PRIMARY KEY,
  character_id VARCHAR(64) NOT NULL,
  adventure_id VARCHAR(64) NOT NULL,
  room_id VARCHAR(64) NULL,
  requester_user_id VARCHAR(64) NOT NULL,
  pack_id VARCHAR(64) NOT NULL,
  entry_id VARCHAR(64) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  merge_existing TINYINT(1) NOT NULL DEFAULT 0,
  instance_id VARCHAR(64) NULL,
  item_label VARCHAR(200) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  gm_user_id VARCHAR(64) NULL,
  resolved_at BIGINT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  KEY idx_eldarin_inventory_item_requests_adventure_status (adventure_id, status, created_at),
  KEY idx_eldarin_inventory_item_requests_character_status (character_id, status),
  CONSTRAINT eldarin_inventory_item_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'consumed'))
);
