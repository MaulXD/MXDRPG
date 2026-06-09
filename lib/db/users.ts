import { hashPassword } from "@/lib/auth/password";
import { normalizeNickname, validateNickname } from "@/lib/auth/nickname";
import { normalizeUserRole } from "@/lib/auth/roles";
import type { SessionUser, UserRole } from "@/lib/auth/types";
import {
  normalizeAvatarSource,
  resolveUserAvatarUrl,
  sanitizeCustomAvatarUrl,
  type AvatarSource,
} from "@/lib/db/user-avatar";
import { getSql } from "@/lib/db/client";

export type StoredUser = {
  id: string;
  clerkId?: string | null;
  email: string;
  nickname?: string | null;
  name: string;
  passwordHash: string | null;
  cpfPrefixHash?: string | null;
  birthDate?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  oauthAvatarUrl?: string | null;
  avatarSource?: AvatarSource;
  createdAt: number;
};

function slugEmail(email: string): string {
  return email.toLowerCase().trim();
}

type UserRow = {
  id: string;
  clerk_id: string | null;
  email: string;
  nickname: string | null;
  name: string;
  password_hash: string | null;
  cpf_prefix_hash: string | null;
  birth_date: string | Date | null;
  role: string;
  avatar_url: string | null;
  oauth_avatar_url: string | null;
  avatar_source: string | null;
  created_at: number;
};

const USER_SELECT =
  "id, clerk_id, email, nickname, name, password_hash, cpf_prefix_hash, birth_date, role, avatar_url, oauth_avatar_url, avatar_source, created_at";

function formatBirthDate(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const raw = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function rowToStored(r: UserRow): StoredUser {
  const avatarSource = normalizeAvatarSource(r.avatar_source);
  return {
    id: r.id,
    clerkId: r.clerk_id,
    email: r.email,
    nickname: r.nickname,
    name: r.name,
    passwordHash: r.password_hash,
    cpfPrefixHash: r.cpf_prefix_hash,
    birthDate: formatBirthDate(r.birth_date),
    role: normalizeUserRole(r.role),
    avatarUrl: r.avatar_url,
    oauthAvatarUrl: r.oauth_avatar_url,
    avatarSource,
    createdAt: Number(r.created_at),
  };
}

function storedToSession(row: StoredUser | UserRow): SessionUser {
  const avatarSource = normalizeAvatarSource(
    "avatar_source" in row ? row.avatar_source : row.avatarSource
  );
  const avatarUrl = resolveUserAvatarUrl({
    avatarSource,
    avatarUrl: "avatar_url" in row ? row.avatar_url : row.avatarUrl,
    oauthAvatarUrl: "oauth_avatar_url" in row ? row.oauth_avatar_url : row.oauthAvatarUrl,
  });
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    nickname: row.nickname,
    role: normalizeUserRole(row.role),
    avatarUrl,
    oauthAvatarUrl: "oauth_avatar_url" in row ? row.oauth_avatar_url : row.oauthAvatarUrl ?? null,
    avatarSource,
  };
}

function toSessionUser(row: Pick<UserRow, "id" | "email" | "nickname" | "name" | "role" | "avatar_url" | "oauth_avatar_url" | "avatar_source">): SessionUser {
  return storedToSession(row as UserRow);
}

export async function fetchUserByEmail(email: string): Promise<StoredUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const key = slugEmail(email);
  const rows = await sql<UserRow[]>`
    SELECT ${sql.unsafe(USER_SELECT)}
    FROM eldarin_users WHERE LOWER(email) = ${key} LIMIT 1
  `;
  const r = rows[0];
  return r ? rowToStored(r) : null;
}

export async function fetchUserByNickname(nickname: string): Promise<StoredUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const key = normalizeNickname(nickname);
  const rows = await sql<UserRow[]>`
    SELECT ${sql.unsafe(USER_SELECT)}
    FROM eldarin_users WHERE LOWER(nickname) = ${key} LIMIT 1
  `;
  const r = rows[0];
  return r ? rowToStored(r) : null;
}

export async function fetchUserByClerkId(clerkId: string): Promise<StoredUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql<UserRow[]>`
    SELECT ${sql.unsafe(USER_SELECT)}
    FROM eldarin_users WHERE clerk_id = ${clerkId} LIMIT 1
  `;
  const r = rows[0];
  return r ? rowToStored(r) : null;
}

export async function fetchUserById(id: string): Promise<SessionUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql<UserRow[]>`
    SELECT ${sql.unsafe(USER_SELECT)}
    FROM eldarin_users WHERE id = ${id} LIMIT 1
  `;
  const r = rows[0];
  return r ? toSessionUser(r) : null;
}

export async function fetchClerkIdForUser(userId: string): Promise<string | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    const rows = await sql<{ clerk_id: string | null }[]>`
      SELECT clerk_id FROM eldarin_users WHERE id = ${userId} LIMIT 1
    `;
    return rows[0]?.clerk_id ?? null;
  } catch {
    return null;
  }
}

function clerkSessionFallback(input: {
  clerkId: string;
  email: string;
  name: string;
}): SessionUser {
  return {
    id: `clerk-${input.clerkId}`,
    email: input.email,
    name: input.name,
    nickname: null,
    role: "member",
    clerkId: input.clerkId,
  };
}

export async function ensureUserFromClerk(input: {
  clerkId: string;
  email: string;
  name: string;
  oauthAvatarUrl?: string | null;
}): Promise<SessionUser> {
  const sql = getSql();
  if (!sql) return clerkSessionFallback(input);

  const oauthAvatar = input.oauthAvatarUrl?.trim() || null;

  const existing = await fetchUserByClerkId(input.clerkId);
  if (existing) {
    if (oauthAvatar && oauthAvatar !== existing.oauthAvatarUrl) {
      await sql`
        UPDATE eldarin_users
        SET oauth_avatar_url = ${oauthAvatar}, name = ${input.name.slice(0, 80)}
        WHERE id = ${existing.id}
      `;
    }
    const refreshed = await fetchUserById(existing.id);
    if (refreshed) {
      return { ...refreshed, clerkId: input.clerkId };
    }
    return storedToSession(existing);
  }

  const email = slugEmail(input.email);
  const byEmail = await fetchUserByEmail(email);
  if (byEmail) {
    await sql`
      UPDATE eldarin_users
      SET clerk_id = ${input.clerkId},
          name = ${input.name.slice(0, 80)},
          oauth_avatar_url = COALESCE(${oauthAvatar}, oauth_avatar_url)
      WHERE id = ${byEmail.id}
    `;
    const linked = await fetchUserById(byEmail.id);
    if (!linked) return clerkSessionFallback(input);
    return { ...linked, clerkId: input.clerkId };
  }

  const user: StoredUser = {
    id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    clerkId: input.clerkId,
    email,
    nickname: null,
    name: input.name.slice(0, 80),
    passwordHash: null,
    role: "member",
    oauthAvatarUrl: oauthAvatar,
    avatarSource: "oauth",
    createdAt: Date.now(),
  };

  await sql`
    INSERT INTO eldarin_users (
      id, clerk_id, email, nickname, name, password_hash, role, oauth_avatar_url, avatar_source, created_at
    )
    VALUES (
      ${user.id},
      ${user.clerkId ?? null},
      ${user.email},
      ${user.nickname ?? null},
      ${user.name},
      ${user.passwordHash},
      ${user.role},
      ${user.oauthAvatarUrl ?? null},
      ${user.avatarSource ?? "oauth"},
      ${user.createdAt}
    )
  `;
  return storedToSession(user);
}

export async function updateUserAvatar(
  userId: string,
  opts: { avatarSource: AvatarSource; avatarUrl?: string | null }
): Promise<SessionUser> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL não configurada");

  const avatarSource = normalizeAvatarSource(opts.avatarSource);

  const existing = await sql<UserRow[]>`
    SELECT ${sql.unsafe(USER_SELECT)} FROM eldarin_users WHERE id = ${userId} LIMIT 1
  `;
  const row = existing[0];
  if (!row) throw new Error("Conta não encontrada");

  let customUrl = row.avatar_url;
  if (avatarSource === "custom") {
    if (opts.avatarUrl !== undefined && opts.avatarUrl !== null && String(opts.avatarUrl).trim()) {
      customUrl = sanitizeCustomAvatarUrl(opts.avatarUrl);
    }
    if (!customUrl) {
      throw new Error("Informe uma foto válida (URL ou upload)");
    }
  }

  await sql`
    UPDATE eldarin_users
    SET avatar_source = ${avatarSource},
        avatar_url = ${avatarSource === "custom" ? customUrl : row.avatar_url}
    WHERE id = ${userId}
  `;

  const updated = await fetchUserById(userId);
  if (!updated) throw new Error("Conta não encontrada");
  return updated;
}

export async function insertUser(
  email: string,
  name: string,
  password: string,
  role: UserRole = "member",
  nickname?: string | null
): Promise<StoredUser> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL não configurada");

  const key = slugEmail(email);
  let nick: string | null = null;
  if (nickname) {
    const v = validateNickname(nickname);
    if (!v.ok) throw new Error(v.error);
    nick = v.nickname;
    const taken = await fetchUserByNickname(nick);
    if (taken) throw new Error("Este apelido já está em uso");
  }

  const user: StoredUser = {
    id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    email: key,
    nickname: nick,
    name: name.trim().slice(0, 80),
    passwordHash: hashPassword(password),
    role,
    createdAt: Date.now(),
  };

  await sql`
    INSERT INTO eldarin_users (id, clerk_id, email, nickname, name, password_hash, role, created_at)
    VALUES (
      ${user.id},
      ${null},
      ${user.email},
      ${user.nickname ?? null},
      ${user.name},
      ${user.passwordHash},
      ${user.role},
      ${user.createdAt}
    )
  `;
  return user;
}

export async function setUserNickname(userId: string, nickname: string): Promise<SessionUser> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL não configurada");

  const v = validateNickname(nickname);
  if (!v.ok) throw new Error(v.error);

  const taken = await fetchUserByNickname(v.nickname);
  if (taken && taken.id !== userId) throw new Error("Este apelido já está em uso");

  await sql`UPDATE eldarin_users SET nickname = ${v.nickname} WHERE id = ${userId}`;
  return (await fetchUserById(userId))!;
}

export async function completeUserPasswordRegistration(
  userId: string,
  password: string,
  opts?: { name?: string; nickname?: string | null }
): Promise<StoredUser> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL não configurada");
  if (password.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres");

  const existing = await sql<UserRow[]>`
    SELECT ${sql.unsafe(USER_SELECT)}
    FROM eldarin_users WHERE id = ${userId} LIMIT 1
  `;
  const row = existing[0];
  if (!row) throw new Error("Conta não encontrada");
  if (row.password_hash) throw new Error("Esta conta já possui senha — faça login");

  let nick = row.nickname;
  if (opts?.nickname?.trim()) {
    const v = validateNickname(opts.nickname);
    if (!v.ok) throw new Error(v.error);
    const taken = await fetchUserByNickname(v.nickname);
    if (taken && taken.id !== userId) throw new Error("Este apelido já está em uso");
    nick = v.nickname;
  }

  const name = opts?.name?.trim().slice(0, 80) || row.name;
  const passwordHash = hashPassword(password);

  await sql`
    UPDATE eldarin_users
    SET password_hash = ${passwordHash}, name = ${name}, nickname = ${nick}
    WHERE id = ${userId}
  `;

  const updated = await sql<UserRow[]>`
    SELECT ${sql.unsafe(USER_SELECT)}
    FROM eldarin_users WHERE id = ${userId} LIMIT 1
  `;
  return rowToStored(updated[0]!);
}

export async function updateUserProfile(
  userId: string,
  opts: { name?: string; nickname?: string | null }
): Promise<StoredUser> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL não configurada");

  const existing = await sql<UserRow[]>`
    SELECT ${sql.unsafe(USER_SELECT)}
    FROM eldarin_users WHERE id = ${userId} LIMIT 1
  `;
  const row = existing[0];
  if (!row) throw new Error("Conta não encontrada");

  let nick = row.nickname;
  if (opts.nickname !== undefined) {
    if (opts.nickname?.trim()) {
      const v = validateNickname(opts.nickname);
      if (!v.ok) throw new Error(v.error);
      const taken = await fetchUserByNickname(v.nickname);
      if (taken && taken.id !== userId) throw new Error("Este apelido já está em uso");
      nick = v.nickname;
    } else {
      nick = null;
    }
  }

  const name = opts.name?.trim().slice(0, 80) || row.name;

  await sql`
    UPDATE eldarin_users SET name = ${name}, nickname = ${nick} WHERE id = ${userId}
  `;

  const updated = await sql<UserRow[]>`
    SELECT ${sql.unsafe(USER_SELECT)}
    FROM eldarin_users WHERE id = ${userId} LIMIT 1
  `;
  return rowToStored(updated[0]!);
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL não configurada");

  await sql`DELETE FROM eldarin_characters WHERE owner_id = ${userId}`;
  await sql`DELETE FROM eldarin_users WHERE id = ${userId}`;
}

export async function upsertSeedUser(user: StoredUser): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql`
    INSERT INTO eldarin_users (id, clerk_id, email, nickname, name, password_hash, role, created_at)
    VALUES (
      ${user.id},
      ${user.clerkId ?? null},
      ${slugEmail(user.email)},
      ${user.nickname ?? null},
      ${user.name},
      ${user.passwordHash},
      ${user.role},
      ${user.createdAt}
    )
    ON CONFLICT (id) DO UPDATE SET
      nickname = EXCLUDED.nickname,
      name = EXCLUDED.name,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role
  `;
}
