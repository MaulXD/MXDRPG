import { cookies } from "next/headers";
import { resolveClerkSessionUser } from "@/lib/auth/clerk-sync";
import { isClerkEnabled } from "@/lib/auth/clerk-config";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { dbEnabled } from "@/lib/db/enabled";
import { normalizeUserRole } from "./roles";
import type { SessionPayload, SessionUser, UserRole } from "./types";

export const SESSION_COOKIE = "vinite_session";

function encode(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decode(raw: string): SessionPayload | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const data = JSON.parse(json) as SessionPayload;
    if (!data?.user?.id) return null;
    data.user.role = normalizeUserRole(data.user.role as string);
    return data;
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser): Promise<void> {
  const payload: SessionPayload = { user, issuedAt: Date.now() };
  const store = await cookies();
  store.set(SESSION_COOKIE, encode(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Sessão legada (e-mail/senha) sem Clerk ativo no request. */
export async function getLegacyCookieSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decode(raw);
}

export async function getSession(): Promise<SessionPayload | null> {
  if (!isClerkEnabled()) return null;

  if (dbEnabled()) {
    try {
      await ensureDbMigrations();
    } catch {
      /* queries podem falhar; clerk-sync usa sessão efêmera */
    }
  }

  const clerkUser = await resolveClerkSessionUser();
  if (clerkUser) {
    return { user: clerkUser, issuedAt: Date.now() };
  }

  return null;
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session.user;
}

export async function requireRole(allowed: UserRole[]): Promise<SessionUser> {
  const user = await requireSession();
  if (!allowed.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
