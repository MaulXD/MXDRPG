import { hashPassword } from "@/lib/auth/password";
import { generateUniqueDefaultNickname, normalizeNickname, validateNickname } from "@/lib/auth/nickname";
import { normalizeUserRole } from "@/lib/auth/roles";
import type { SessionUser, UserRole } from "@/lib/auth/types";
import {
  normalizeAvatarSource,
  parseAvatarFocus,
  resolveUserAvatarUrl,
  sanitizeCustomAvatarUrl,
  type AvatarSource,
} from "@/lib/db/user-avatar";
import { normalizeImageDataUrl } from "@/lib/media/image-normalize";
import { sanitizePortraitFocus, type PortraitFocus } from "@/lib/media/portrait-focus";
import { getSql } from "@/lib/db/client";
import { safeDbRead } from "@/lib/db/safe-query";
import type { EldarinSql } from "@/lib/db/sql-types";
import type { OAuthProviderId } from "@/lib/auth/oauth-config";

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
  avatarFocus?: PortraitFocus | null;
  oauthProvider?: string | null;
  oauthSubject?: string | null;
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
  avatar_focus: unknown;
  oauth_provider: string | null;
  oauth_subject: string | null;
  created_at: number;
};

const USER_SELECT =
  "id, clerk_id, oauth_provider, oauth_subject, email, nickname, name, password_hash, cpf_prefix_hash, birth_date, role, avatar_url, oauth_avatar_url, avatar_source, avatar_focus, created_at";

async function queryOneUserRow(
  sql: EldarinSql,
  whereSql: string,
  params: unknown[] = []
): Promise<UserRow | null> {
  const rows = (await sql.unsafe(
    `SELECT ${USER_SELECT} FROM eldarin_users WHERE ${whereSql} LIMIT 1`,
    params
  )) as UserRow[];
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

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
    oauthProvider: r.oauth_provider,
    oauthSubject: r.oauth_subject,
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
    avatarFocus: parseAvatarFocus(r.avatar_focus),
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
    nickname: row.nickname,
  });
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    nickname: row.nickname,
    role: normalizeUserRole(row.role),
    avatarUrl,
    oauthAvatarUrl: "oauth_avatar_url" in row ? row.oauth_avatar_url : row.oauthAvatarUrl ?? null,
    oauthProvider:
      ("oauth_provider" in row ? row.oauth_provider : row.oauthProvider) as OAuthProviderId | null,
    oauthSubject:
      ("oauth_subject" in row ? row.oauth_subject : row.oauthSubject) ?? null,
    avatarSource,
    avatarFocus:
      parseAvatarFocus("avatar_focus" in row ? row.avatar_focus : row.avatarFocus) ?? null,
  };
}

function toSessionUser(row: Pick<UserRow, "id" | "email" | "nickname" | "name" | "role" | "avatar_url" | "oauth_avatar_url" | "avatar_source">): SessionUser {
  return storedToSession(row as UserRow);
}

export async function fetchUserByEmail(email: string): Promise<StoredUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const key = slugEmail(email);
  const r = await queryOneUserRow(sql, "LOWER(email) = ?", [key]);
  return r ? rowToStored(r) : null;
}

export async function fetchUserByNickname(nickname: string): Promise<StoredUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const key = normalizeNickname(nickname);
  const r = await queryOneUserRow(sql, "LOWER(nickname) = ?", [key]);
  return r ? rowToStored(r) : null;
}

/** E-mail completo ou apelido / parte local do e-mail (ex.: `mestre` → `mestre@…`). */
export async function fetchUserByLogin(login: string): Promise<StoredUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const trimmed = login.trim();
  if (!trimmed) return null;

  if (trimmed.includes("@")) {
    return fetchUserByEmail(trimmed);
  }

  const key = normalizeNickname(trimmed);
  const rows = (await sql.unsafe(
    `SELECT ${USER_SELECT} FROM eldarin_users
     WHERE LOWER(nickname) = ?
        OR LOWER(SUBSTRING_INDEX(email, '@', 1)) = ?
     LIMIT 1`,
    [key, key]
  )) as UserRow[];
  const r = rows[0];
  return r ? rowToStored(r) : null;
}

export async function fetchUserByOAuthIdentity(
  provider: OAuthProviderId,
  subject: string
): Promise<StoredUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const r = await queryOneUserRow(sql, "oauth_provider = ? AND oauth_subject = ?", [
    provider,
    subject,
  ]);
  return r ? rowToStored(r) : null;
}

function oauthSessionFallback(input: {
  provider: OAuthProviderId;
  subject: string;
  email: string;
  name: string;
  oauthAvatarUrl?: string | null;
}): SessionUser {
  return {
    id: `${input.provider}-${input.subject}`,
    email: input.email,
    name: input.name,
    // Sessão efêmera (sem banco pra checar unicidade) — ainda assim nunca null,
    // pra nunca cair no fallback pro nome real enquanto o banco estiver fora do ar.
    nickname: `jogador${Date.now().toString(36)}`,
    role: "member",
    oauthAvatarUrl: input.oauthAvatarUrl ?? null,
    oauthProvider: input.provider,
    oauthSubject: input.subject,
  };
}

export async function ensureUserFromOAuth(
  input: {
    provider: OAuthProviderId;
    subject: string;
    email: string;
    name: string;
    oauthAvatarUrl?: string | null;
  },
  opts?: { strict?: boolean }
): Promise<SessionUser> {
  const sql = getSql();
  if (!sql) {
    if (opts?.strict) throw new Error("Banco indisponível — tente de novo em instantes");
    return oauthSessionFallback(input);
  }

  try {
    const oauthAvatar = input.oauthAvatarUrl?.trim() || null;

    const existing = await fetchUserByOAuthIdentity(input.provider, input.subject);
    if (existing) {
      if (oauthAvatar && oauthAvatar !== existing.oauthAvatarUrl) {
        await sql`
          UPDATE eldarin_users
          SET oauth_avatar_url = ${oauthAvatar}, name = ${input.name.slice(0, 80)}
          WHERE id = ${existing.id}
        `;
      }
      const refreshed = await fetchUserById(existing.id);
      if (refreshed) return refreshed;
      return storedToSession(existing);
    }

    const email = slugEmail(input.email);
    const byEmail = await fetchUserByEmail(email);
    if (byEmail) {
      await sql`
        UPDATE eldarin_users
        SET oauth_provider = ${input.provider},
            oauth_subject = ${input.subject},
            name = ${input.name.slice(0, 80)},
            oauth_avatar_url = COALESCE(${oauthAvatar}, oauth_avatar_url),
            avatar_source = COALESCE(avatar_source, 'oauth')
        WHERE id = ${byEmail.id}
      `;
      const linked = await fetchUserById(byEmail.id);
      if (!linked) return oauthSessionFallback(input);
      return linked;
    }

    const user: StoredUser = {
      id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      oauthProvider: input.provider,
      oauthSubject: input.subject,
      email,
      nickname: await generateUniqueDefaultNickname((n) => fetchUserByNickname(n).then(Boolean)),
      name: input.name.slice(0, 80),
      passwordHash: null,
      role: "member",
      oauthAvatarUrl: oauthAvatar,
      avatarSource: "oauth",
      createdAt: Date.now(),
    };

    await sql`
      INSERT INTO eldarin_users (
        id, oauth_provider, oauth_subject, email, nickname, name, password_hash, role,
        oauth_avatar_url, avatar_source, created_at
      )
      VALUES (
        ${user.id},
        ${input.provider},
        ${input.subject},
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
  } catch (err) {
    console.error("[auth] ensureUserFromOAuth falhou, sessão efêmera:", err);
    if (opts?.strict) {
      throw err instanceof Error ? err : new Error("Falha ao criar conta no banco");
    }
    return oauthSessionFallback(input);
  }
}

export async function fetchUserByClerkId(clerkId: string): Promise<StoredUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const r = await queryOneUserRow(sql, "clerk_id = ?", [clerkId]);
  return r ? rowToStored(r) : null;
}

export async function fetchUserById(id: string): Promise<SessionUser | null> {
  const sql = getSql();
  if (!sql) return null;
  return safeDbRead("fetchUserById", null, async () => {
    const r = await queryOneUserRow(sql, "id = ?", [id]);
    return r ? toSessionUser(r) : null;
  });
}

/** Leitura sem fallback silencioso — usada antes de gravar apelido/perfil. */
export async function fetchUserByIdStrict(id: string): Promise<SessionUser | null> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL não configurada");
  const r = await queryOneUserRow(sql, "id = ?", [id]);
  return r ? toSessionUser(r) : null;
}

const clerkIdCache = new Map<string, { value: string | null; at: number }>();
const CLERK_ID_CACHE_MS = 60_000;

export async function fetchClerkIdForUser(userId: string): Promise<string | null> {
  const hit = clerkIdCache.get(userId);
  if (hit && Date.now() - hit.at < CLERK_ID_CACHE_MS) return hit.value;

  const sql = getSql();
  if (!sql) return null;
  try {
    const rows = await sql<{ clerk_id: string | null }[]>`
      SELECT clerk_id FROM eldarin_users WHERE id = ${userId} LIMIT 1
    `;
    const value = rows[0]?.clerk_id ?? null;
    clerkIdCache.set(userId, { value, at: Date.now() });
    return value;
  } catch {
    return null;
  }
}

export async function updateUserAvatar(
  userId: string,
  opts: {
    avatarSource: AvatarSource;
    avatarUrl?: string | null;
    avatarFocus?: PortraitFocus | null;
  }
): Promise<SessionUser> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL não configurada");

  const avatarSource = normalizeAvatarSource(opts.avatarSource);

  const row = await queryOneUserRow(sql, "id = ?", [userId]);
  if (!row) throw new Error("Conta não encontrada");

  let customUrl = row.avatar_url;
  let avatarFocus = parseAvatarFocus(row.avatar_focus);

  if (avatarSource === "custom") {
    if (opts.avatarUrl !== undefined && opts.avatarUrl !== null && String(opts.avatarUrl).trim()) {
      let incoming = String(opts.avatarUrl).trim();
      if (incoming.startsWith("data:image/")) {
        const normalized = await normalizeImageDataUrl(incoming);
        if (!normalized) throw new Error("Imagem inválida ou grande demais após compressão");
        incoming = normalized;
      }
      customUrl = sanitizeCustomAvatarUrl(incoming);
    }
    if (!customUrl) {
      throw new Error("Informe uma foto válida (URL ou upload)");
    }
    if (opts.avatarFocus !== undefined) {
      avatarFocus = opts.avatarFocus ? sanitizePortraitFocus(opts.avatarFocus) : null;
    }
  } else if (avatarSource === "generated") {
    customUrl = null;
    avatarFocus = null;
  } else if (opts.avatarFocus !== undefined) {
    avatarFocus = opts.avatarFocus ? sanitizePortraitFocus(opts.avatarFocus) : null;
  }

  const focusJson = avatarFocus ? JSON.stringify(avatarFocus) : null;
  const storedCustomUrl = avatarSource === "custom" ? customUrl : row.avatar_url;

  await sql.unsafe(
    `UPDATE eldarin_users
     SET avatar_source = ?, avatar_url = ?, avatar_focus = ?
     WHERE id = ?`,
    [avatarSource, storedCustomUrl, focusJson, userId]
  );

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
  let nick: string;
  if (nickname) {
    const v = validateNickname(nickname);
    if (!v.ok) throw new Error(v.error);
    nick = v.nickname;
    const taken = await fetchUserByNickname(nick);
    if (taken) throw new Error("Este apelido já está em uso");
  } else {
    nick = await generateUniqueDefaultNickname((n) => fetchUserByNickname(n).then(Boolean));
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

/**
 * Repara contas antigas (de antes da geração automática de apelido) que ainda
 * têm nickname null no banco — chamada uma vez por conta a partir de
 * materializeSessionUser. Guard `nickname IS NULL` evita sobrescrever uma
 * troca concorrente feita pelo próprio usuário em /conta.
 */
export async function backfillDefaultNickname(userId: string): Promise<SessionUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const nickname = await generateUniqueDefaultNickname((n) => fetchUserByNickname(n).then(Boolean));
  await sql`UPDATE eldarin_users SET nickname = ${nickname} WHERE id = ${userId} AND nickname IS NULL`;
  return fetchUserById(userId);
}

export async function setUserNickname(userId: string, nickname: string): Promise<SessionUser> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL não configurada");

  const v = validateNickname(nickname);
  if (!v.ok) throw new Error(v.error);

  let resolvedId = userId;
  if (userId.startsWith("clerk-")) {
    const stored = await fetchUserByClerkId(userId.slice("clerk-".length));
    if (!stored) throw new Error("Conta não encontrada — saia e entre de novo");
    resolvedId = stored.id;
  }

  const existing = await fetchUserByIdStrict(resolvedId);
  if (!existing) throw new Error("Conta não encontrada — saia e entre de novo");

  const taken = await fetchUserByNickname(v.nickname);
  if (taken && taken.id !== resolvedId) throw new Error("Este apelido já está em uso");

  await sql`UPDATE eldarin_users SET nickname = ${v.nickname} WHERE id = ${resolvedId}`;
  const updated = await fetchUserById(resolvedId);
  if (!updated?.nickname) throw new Error("Falha ao salvar apelido — tente de novo");
  return updated;
}

export async function completeUserPasswordRegistration(
  userId: string,
  password: string,
  opts?: { name?: string; nickname?: string | null }
): Promise<StoredUser> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL não configurada");
  if (password.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres");

  const existing = await queryOneUserRow(sql, "id = ?", [userId]);
  if (!existing) throw new Error("Conta não encontrada");
  const row = existing;
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

  const updated = await queryOneUserRow(sql, "id = ?", [userId]);
  if (!updated) throw new Error("Conta não encontrada");
  return rowToStored(updated);
}

export async function updateUserProfile(
  userId: string,
  opts: { name?: string; nickname?: string | null }
): Promise<StoredUser> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL não configurada");

  const existing = await queryOneUserRow(sql, "id = ?", [userId]);
  if (!existing) throw new Error("Conta não encontrada");
  const row = existing;

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

  const updated = await queryOneUserRow(sql, "id = ?", [userId]);
  if (!updated) throw new Error("Conta não encontrada");
  return rowToStored(updated);
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
  await sql.unsafe(
    `INSERT INTO eldarin_users (id, clerk_id, email, nickname, name, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       nickname = VALUES(nickname),
       name = VALUES(name),
       password_hash = VALUES(password_hash),
       role = VALUES(role)`,
    [
      user.id,
      user.clerkId ?? null,
      slugEmail(user.email),
      user.nickname ?? null,
      user.name,
      user.passwordHash,
      user.role,
      user.createdAt,
    ]
  );
}
