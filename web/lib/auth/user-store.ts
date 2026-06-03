import fs from "fs";
import path from "path";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { SessionUser, UserRole } from "@/lib/auth/types";

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  createdAt: number;
};

const SEED_PATH = path.join(process.cwd(), "data/users/registry.seed.json");
const REGISTRY_PATH = path.join(process.cwd(), "data/users/registry.json");

declare global {
  // eslint-disable-next-line no-var
  var __eldarinUserRegistry: Map<string, StoredUser> | undefined;
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

function toSessionUser(u: StoredUser): SessionUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

export function authenticateUser(email: string, password: string): SessionUser | null {
  const key = slugEmail(email);
  const found = registry().get(key);
  if (!found || !verifyPassword(password, found.passwordHash)) return null;
  return toSessionUser(found);
}

export type RegisterResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

export function registerUser(
  email: string,
  name: string,
  password: string
): RegisterResult {
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
  if (registry().has(key)) {
    return { ok: false, error: "Este e-mail já está cadastrado" };
  }

  const user: StoredUser = {
    id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    email: key,
    name: displayName,
    passwordHash: hashPassword(password),
    role: "member",
    createdAt: Date.now(),
  };

  registry().set(key, user);
  savePersisted(registry().values());

  return { ok: true, user: toSessionUser(user) };
}

export function getUserById(id: string): SessionUser | null {
  for (const u of registry().values()) {
    if (u.id === id) return toSessionUser(u);
  }
  return null;
}

/** Compat: login demo legado */
export function authenticateDemo(email: string, password: string): SessionUser | null {
  return authenticateUser(email, password);
}
