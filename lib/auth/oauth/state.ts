import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { OAuthProviderId } from "@/lib/auth/oauth-config";
import { safeRedirectPath } from "@/lib/auth/post-auth-redirect";
import { MESAS_HUB_PATH } from "@/lib/rpg/systems";

const COOKIE = "eldarin_oauth";
const TTL_MS = 10 * 60 * 1000;

type PendingOAuth = {
  state: string;
  provider: OAuthProviderId;
  redirect: string;
  exp: number;
};

function secret(): string {
  const s = process.env.SESSION_SECRET?.trim() || process.env.OAUTH_STATE_SECRET?.trim();
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET (ou OAUTH_STATE_SECRET) é obrigatório para OAuth");
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encode(bundle: PendingOAuth): string {
  const payload = Buffer.from(JSON.stringify(bundle), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(raw: string): PendingOAuth | null {
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json) as PendingOAuth;
  } catch {
    return null;
  }
}

export async function beginOAuthState(
  provider: OAuthProviderId,
  redirect?: string | null
): Promise<{ state: string; setCookie: string }> {
  const bundle: PendingOAuth = {
    state: randomBytes(24).toString("base64url"),
    provider,
    redirect: safeRedirectPath(redirect) ?? MESAS_HUB_PATH,
    exp: Date.now() + TTL_MS,
  };
  const value = encode(bundle);
  return { state: bundle.state, setCookie: value };
}

export type OAuthStateFailure =
  | "missing"
  | "invalid"
  | "provider"
  | "expired"
  | "mismatch";

export async function consumeOAuthState(
  provider: OAuthProviderId,
  stateFromQuery: string
): Promise<{ redirect: string } | { failure: OAuthStateFailure }> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return { failure: "missing" };

  const bundle = decode(raw);
  if (!bundle) {
    store.delete(COOKIE);
    return { failure: "invalid" };
  }
  if (bundle.provider !== provider) {
    store.delete(COOKIE);
    return { failure: "provider" };
  }
  if (bundle.exp < Date.now()) {
    store.delete(COOKIE);
    return { failure: "expired" };
  }
  if (bundle.state !== stateFromQuery) {
    store.delete(COOKIE);
    return { failure: "mismatch" };
  }

  store.delete(COOKIE);
  return { redirect: bundle.redirect };
}

export function oauthStateCookieOptions(value: string) {
  return {
    name: COOKIE,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TTL_MS / 1000,
  };
}

/** Anexa cookie OAuth ao redirect (mais confiável que cookies().set + redirect). */
export function applyOAuthStateCookie(response: NextResponse, value: string): void {
  response.cookies.set(oauthStateCookieOptions(value));
}
