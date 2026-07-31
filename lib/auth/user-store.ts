import fs from "fs";
import path from "path";
import { dbSqlReady } from "@/lib/db/sql-ready";
import { generateUniqueDefaultNickname, normalizeNickname, validateNickname } from "@/lib/auth/nickname";
import {
  completeUserPasswordRegistration,
  fetchUserByEmail,
  fetchUserById,
  fetchUserByLogin,
  fetchUserByNickname,
  insertUser,
  updateUserProfile,
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
  if (!dbSqlReady() || globalThis.__eldarinDbUsersSeeded) return;
  try {
    for (const u of loadSeed()) {
      await upsertSeedUser(u);
    }
    globalThis.__eldarinDbUsersSeeded = true;
  } catch (err) {
    console.error("[auth] seed demo users no MariaDB falhou:", err);
  }
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

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

async function resolveUserForLogin(login: string): Promise<StoredUser | null> {
  const trimmed = login.trim();
  if (!trimmed) return null;

  if (dbSqlReady()) {
    try {
      await ensureDbUsersSeeded();
      const fromDb = await fetchUserByLogin(trimmed);
      if (fromDb) return fromDb;
    } catch (err) {
      console.error("[auth] login via MariaDB falhou, tentando registry local:", err);
    }
  }

  return findLocalUser(trimmed) ?? null;
}

export async function loginUser(login: string, password: string): Promise<LoginResult> {
  const trimmed = login.trim();
  if (!trimmed) return { ok: false, error: "Informe e-mail, apelido ou usuário" };
  if (!password) return { ok: false, error: "Informe sua senha" };

  const found = await resolveUserForLogin(trimmed);
  if (!found) return { ok: false, error: "Credenciais inválidas" };

  if (!found.passwordHash) {
    return {
      ok: false,
      error:
        "Esta conta usa login social. Entre com Google/Discord ou crie uma senha em Criar conta com o mesmo e-mail.",
    };
  }

  if (!verifyPassword(password, found.passwordHash)) {
    return { ok: false, error: "Credenciais inválidas" };
  }

  return { ok: true, user: toSessionUser(found) };
}

export async function authenticateUser(
  login: string,
  password: string
): Promise<SessionUser | null> {
  const result = await loginUser(login, password);
  return result.ok ? result.user : null;
}

export type RegisterResult =
  | {
      ok: true;
      user: SessionUser;
      completedSocialAccount?: boolean;
      existingAccountLogin?: boolean;
    }
  | { ok: false; error: string };

function existingAccountError(existing: StoredUser): string {
  if (existing.clerkId) {
    return "Este e-mail já tem conta. Vá em Entrar com a senha correta ou use Google/Discord acima.";
  }
  return "Este e-mail já tem conta. A senha não confere — vá em Entrar e use sua senha atual.";
}

async function loginExistingWithPassword(
  existing: StoredUser,
  password: string,
  displayName: string,
  nickname?: string
): Promise<RegisterResult> {
  if (!existing.passwordHash) {
    return { ok: false, error: existingAccountError(existing) };
  }
  if (!verifyPassword(password, existing.passwordHash)) {
    return { ok: false, error: existingAccountError(existing) };
  }

  if (dbSqlReady()) {
    try {
      const user = await updateUserProfile(existing.id, {
        name: displayName,
        nickname: nickname?.trim() ? nickname : undefined,
      });
      return { ok: true, user: toSessionUser(user), existingAccountLogin: true };
    } catch (e) {
      return { ok: true, user: toSessionUser(existing), existingAccountLogin: true };
    }
  }

  let nick = existing.nickname ?? null;
  if (nickname?.trim()) {
    const v = validateNickname(nickname);
    if (v.ok) nick = v.nickname;
  }
  const updated: StoredUser = {
    ...existing,
    name: displayName,
    nickname: nick,
  };
  registry().set(slugEmail(existing.email), updated);
  savePersisted(registry().values());
  return { ok: true, user: toSessionUser(updated), existingAccountLogin: true };
}

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

  if (dbSqlReady()) {
    await ensureDbUsersSeeded();
    const existing = await fetchUserByEmail(key);
    if (existing) {
      if (!existing.passwordHash) {
        try {
          const user = await completeUserPasswordRegistration(existing.id, password, {
            name: displayName,
            nickname,
          });
          return { ok: true, user: toSessionUser(user), completedSocialAccount: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Cadastro inválido" };
        }
      }
      return loginExistingWithPassword(existing, password, displayName, nickname);
    }
    try {
      const user = await insertUser(key, displayName, password, "member", nickname);
      return { ok: true, user: toSessionUser(user) };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Cadastro inválido" };
    }
  }

  const existingLocal = registry().get(key);
  if (existingLocal) {
    if (!existingLocal.passwordHash) {
      let nick: string | null = existingLocal.nickname ?? null;
      if (nickname?.trim()) {
        const v = validateNickname(nickname);
        if (!v.ok) return { ok: false, error: v.error };
        nick = v.nickname;
        if (findLocalUser(nick) && findLocalUser(nick)?.id !== existingLocal.id) {
          return { ok: false, error: "Este apelido já está em uso" };
        }
      }
      const updated: StoredUser = {
        ...existingLocal,
        name: displayName,
        nickname: nick,
        passwordHash: hashPassword(password),
      };
      registry().set(key, updated);
      savePersisted(registry().values());
      return { ok: true, user: toSessionUser(updated), completedSocialAccount: true };
    }
    return loginExistingWithPassword(existingLocal, password, displayName, nickname);
  }

  let nick: string;
  if (nickname?.trim()) {
    const v = validateNickname(nickname);
    if (!v.ok) return { ok: false, error: v.error };
    nick = v.nickname;
    if (findLocalUser(nick)) {
      return { ok: false, error: "Este apelido já está em uso" };
    }
  } else {
    nick = await generateUniqueDefaultNickname((n) => Boolean(findLocalUser(n)));
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
  if (dbSqlReady()) {
    const fromDb = await fetchUserById(id);
    if (fromDb) return fromDb;
  }
  for (const u of registry().values()) {
    if (u.id === id) return toSessionUser(u);
  }
  return null;
}

export function getLocalUserByEmail(email: string): StoredUser | undefined {
  return registry().get(slugEmail(email));
}

export function getLocalUserById(id: string): StoredUser | undefined {
  for (const u of registry().values()) {
    if (u.id === id) return u;
  }
  return undefined;
}

export function updateLocalUserRecord(user: StoredUser): void {
  registry().set(slugEmail(user.email), user);
  savePersisted(registry().values());
}
