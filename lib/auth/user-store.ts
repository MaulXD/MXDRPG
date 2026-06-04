import fs from "fs";
import path from "path";
import { dbEnabled } from "@/lib/db/enabled";
import { normalizeNickname, validateNickname } from "@/lib/auth/nickname";
import {
  fetchUserByEmail,
  fetchUserById,
  fetchUserByNickname,
  insertUser,
  upsertSeedUser,
  type StoredUser,
} from "@/lib/db/users";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { normalizeUserRole } from "@/lib/auth/roles";
import type { SessionUser, UserRole } from "@/lib/auth/types";

export type { StoredUser };

const SEED_PATH = path.join(process.cwd(), "data/users/registry.seed.json");
const REGISTRY_PATH = path.join(process.cwd(), "data/users/registry.json");

declare global {
  // eslint-disable-next-line no-var
  var __eldarinUserRegistry: Map<string, StoredUser> | undefined;
  // eslint-disable-next-line no-var
  var __eldarinDbUsersSeeded: boolean | undefined;
}

function slugEmail(email: string): string {
  return email.toLowerCase().trim();
}

function loadSeed(): StoredUser[] {
  try {
    const raw = fs.readFileSync(SEED_PATH, "utf8");
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function loadPersisted(): StoredUser[] {
  try {
    if (!fs.existsSync(REGISTRY_PATH)) return [];
    const raw = fs.readFileSync(REGISTRY_PATH, "utf8");
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function savePersisted(users: Iterable<StoredUser>): void {
  const dir = path.dirname(REGISTRY_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const list = [...users];
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(list, null, 2), "utf8");
}

function registry(): Map<string, StoredUser> {
  if (!globalThis.__eldarinUserRegistry) {
    const map = new Map<string, StoredUser>();
    for (const u of loadSeed()) map.set(slugEmail(u.email), u);
    for (const u of loadPersisted()) map.set(slugEmail(u.email), u);
    globalThis.__eldarinUserRegistry = map;
  }
  return globalThis.__eldarinUserRegistry;
}

async function ensureDbUsersSeeded(): Promise<void> {
  if (!dbEnabled() || globalThis.__eldarinDbUsersSeeded) return;
  for (const u of loadSeed()) {
    await upsertSeedUser(u);
  }
  globalThis.__eldarinDbUsersSeeded = true;
}

function toSessionUser(u: StoredUser): SessionUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    nickname: u.nickname ?? null,
    role: normalizeUserRole(u.role as string),
  };
}

function findLocalUser(login: string): StoredUser | undefined {
  const trimmed = login.trim();
  if (trimmed.includes("@")) {
    return registry().get(slugEmail(trimmed));
  }
  const nick = normalizeNickname(trimmed);
  for (const u of registry().values()) {
    if (u.nickname && normalizeNickname(u.nickname) === nick) return u;
    const local = u.email.split("@")[0];
    if (normalizeNickname(local) === nick) return u;
  }
  return undefined;
}

export async function authenticateUser(
  login: string,
  password: string
): Promise<SessionUser | null> {
  const trimmed = login.trim();
  const byEmail = trimmed.includes("@");

  if (dbEnabled()) {
    await ensureDbUsersSeeded();
    const found = byEmail
      ? await fetchUserByEmail(trimmed)
      : await fetchUserByNickname(trimmed);
    if (!found?.passwordHash || !verifyPassword(password, found.passwordHash)) return null;
    return toSessionUser(found);
  }

  const found = findLocalUser(trimmed);
  if (!found?.passwordHash || !verifyPassword(password, found.passwordHash)) return null;
  return toSessionUser(found);
}

export type RegisterResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

export async function registerUser(
  email: string,
  name: string,
  password: string,
  nickname?: string
): Promise<RegisterResult> {
  const key = slugEmail(email);
  if (!key.includes("@") || key.length < 5) {
    return { ok: false, error: "E-mail inválido" };
  }
  if (password.length < 6) {
    return { ok: false, error: "Senha deve ter pelo menos 6 caracteres" };
  }
  const displayName = name.trim().slice(0, 80);
  if (!displayName) {
    return { ok: false, error: "Informe seu nome" };
  }

  if (dbEnabled()) {
    await ensureDbUsersSeeded();
    const existing = await fetchUserByEmail(key);
    if (existing) {
      return { ok: false, error: "Este e-mail já está cadastrado" };
    }
    try {
      const user = await insertUser(key, displayName, password, "member", nickname);
      return { ok: true, user: toSessionUser(user) };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Cadastro inválido" };
    }
  }

  if (registry().has(key)) {
    return { ok: false, error: "Este e-mail já está cadastrado" };
  }

  let nick: string | null = null;
  if (nickname?.trim()) {
    const v = validateNickname(nickname);
    if (!v.ok) return { ok: false, error: v.error };
    nick = v.nickname;
    if (findLocalUser(nick)) {
      return { ok: false, error: "Este apelido já está em uso" };
    }
  }

  const user: StoredUser = {
    id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    email: key,
    nickname: nick,
    name: displayName,
    passwordHash: hashPassword(password),
    role: "member",
    createdAt: Date.now(),
  };

  registry().set(key, user);
  savePersisted(registry().values());

  return { ok: true, user: toSessionUser(user) };
}

export async function getUserById(id: string): Promise<SessionUser | null> {
  if (dbEnabled()) {
    return fetchUserById(id);
  }
  for (const u of registry().values()) {
    if (u.id === id) return toSessionUser(u);
  }
  return null;
}

/** Compat: login demo legado */
export async function authenticateDemo(
  email: string,
  password: string
): Promise<SessionUser | null> {
  return authenticateUser(email, password);
}
