import { hashPassword } from "@/lib/auth/password";
import { normalizeNickname, validateNickname } from "@/lib/auth/nickname";
import { normalizeUserRole } from "@/lib/auth/roles";
import type { SessionUser, UserRole } from "@/lib/auth/types";
import { getSql } from "@/lib/db/client";

export type StoredUser = {
  id: string;
  clerkId?: string | null;
  email: string;
  nickname?: string | null;
  name: string;
  passwordHash: string | null;
  role: UserRole;
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
  role: string;
  created_at: number;
};

function rowToStored(r: UserRow): StoredUser {
  return {
    id: r.id,
    clerkId: r.clerk_id,
    email: r.email,
    nickname: r.nickname,
    name: r.name,
    passwordHash: r.password_hash,
    role: normalizeUserRole(r.role),
    createdAt: Number(r.created_at),
  };
}

function toSessionUser(row: Pick<UserRow, "id" | "email" | "nickname" | "name" | "role">): SessionUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    nickname: row.nickname,
    role: normalizeUserRole(row.role),
  };
}

export async function fetchUserByEmail(email: string): Promise<StoredUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const key = slugEmail(email);
  const rows = await sql<UserRow[]>`
    SELECT id, clerk_id, email, nickname, name, password_hash, role, created_at
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
    SELECT id, clerk_id, email, nickname, name, password_hash, role, created_at
    FROM eldarin_users WHERE LOWER(nickname) = ${key} LIMIT 1
  `;
  const r = rows[0];
  return r ? rowToStored(r) : null;
}

export async function fetchUserByClerkId(clerkId: string): Promise<StoredUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql<UserRow[]>`
    SELECT id, clerk_id, email, nickname, name, password_hash, role, created_at
    FROM eldarin_users WHERE clerk_id = ${clerkId} LIMIT 1
  `;
  const r = rows[0];
  return r ? rowToStored(r) : null;
}

export async function fetchUserById(id: string): Promise<SessionUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql<UserRow[]>`
    SELECT id, clerk_id, email, nickname, name, password_hash, role, created_at
    FROM eldarin_users WHERE id = ${id} LIMIT 1
  `;
  const r = rows[0];
  return r ? toSessionUser(r) : null;
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
  };
}

export async function ensureUserFromClerk(input: {
  clerkId: string;
  email: string;
  name: string;
}): Promise<SessionUser> {
  const sql = getSql();
  if (!sql) return clerkSessionFallback(input);

  const existing = await fetchUserByClerkId(input.clerkId);
  if (existing) {
    return {
      id: existing.id,
      email: existing.email,
      name: existing.name,
      nickname: existing.nickname ?? null,
      role: existing.role,
    };
  }

  const email = slugEmail(input.email);
  const byEmail = await fetchUserByEmail(email);
  if (byEmail) {
    await sql`
      UPDATE eldarin_users SET clerk_id = ${input.clerkId}, name = ${input.name.slice(0, 80)}
      WHERE id = ${byEmail.id}
    `;
    return (await fetchUserById(byEmail.id))!;
  }

  const user: StoredUser = {
    id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    clerkId: input.clerkId,
    email,
    nickname: null,
    name: input.name.slice(0, 80),
    passwordHash: null,
    role: "member",
    createdAt: Date.now(),
  };

  await sql`
    INSERT INTO eldarin_users (id, clerk_id, email, nickname, name, password_hash, role, created_at)
    VALUES (
      ${user.id},
      ${user.clerkId ?? null},
      ${user.email},
      ${user.nickname ?? null},
      ${user.name},
      ${user.passwordHash},
      ${user.role},
      ${user.createdAt}
    )
  `;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    nickname: user.nickname ?? null,
    role: user.role,
  };
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
