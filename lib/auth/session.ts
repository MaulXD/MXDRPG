import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeUserRole } from "./roles";
import type { SessionPayload, SessionUser, UserRole } from "./types";

export const SESSION_COOKIE = "vinite_session";

/** Mesmo segredo/padrão HMAC de lib/auth/oauth/state.ts — mantém as duas assinaturas em sincronia. */
function secret(): string {
  const s = process.env.SESSION_SECRET?.trim() || process.env.OAUTH_STATE_SECRET?.trim();
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET (ou OAUTH_STATE_SECRET) é obrigatório para sessão");
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encode(payload: SessionPayload): string {
  // Data URLs can be hundreds of KB — exceeds browser cookie limit (~4KB).
  // Strip them here so the cookie never blows up; the actual image stays in DB.
  const safe: SessionPayload =
    payload.user.avatarUrl?.startsWith("data:")
      ? { ...payload, user: { ...payload.user, avatarUrl: null } }
      : payload;
  const body = Buffer.from(JSON.stringify(safe), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

/**
 * Cookie sem "." (formato pré-assinatura) é rejeitado de propósito — força
 * relogin em vez de aceitar uma sessão forjável. Ver auditoria de segurança
 * de 2026-07-31: vinite_session era só base64url(JSON), sem verificação de
 * integridade nenhuma.
 */
function decode(raw: string): SessionPayload | null {
  const sepIndex = raw.lastIndexOf(".");
  if (sepIndex < 0) return null;
  const body = raw.slice(0, sepIndex);
  const sig = raw.slice(sepIndex + 1);
  if (!body || !sig) return null;

  let expected: string;
  try {
    expected = sign(body);
  } catch {
    return null;
  }
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const json = Buffer.from(body, "base64url").toString("utf8");
    const data = JSON.parse(json) as SessionPayload;
    if (!data?.user?.id) return null;
    data.user.role = normalizeUserRole(data.user.role as string);
    return data;
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser): Promise<void> {
  const store = await cookies();
  const c = buildSessionCookie(user);
  store.set(c.name, c.value, {
    httpOnly: c.httpOnly,
    secure: c.secure,
    sameSite: c.sameSite,
    path: c.path,
    maxAge: c.maxAge,
  });
}

export function buildSessionCookie(user: SessionUser) {
  const payload: SessionPayload = { user, issuedAt: Date.now() };
  return {
    name: SESSION_COOKIE,
    value: encode(payload),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

/** Grava sessão em resposta de redirect (cookies() sozinho pode não anexar ao 302). */
export function applySessionCookie(response: NextResponse, user: SessionUser): void {
  response.cookies.set(buildSessionCookie(user));
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decode(raw);
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
