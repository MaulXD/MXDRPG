import { dbEnabled } from "@/lib/db/enabled";
import type { SessionUser } from "@/lib/auth/types";

/** Destino padrão após login/cadastro — mesas Eldarin. */
export const DEFAULT_POST_AUTH_PATH = "/eldarin";

export function safeRedirectPath(raw: string | undefined | null): string | null {
  const t = (raw ?? "").trim();
  if (!t.startsWith("/") || t.startsWith("//")) return null;
  return t;
}

/** Após autenticação: apelido (se Postgres) e depois mesas ou URL pedida. */
export function postAuthRedirect(user: SessionUser, requested?: string | null): string {
  const dest = safeRedirectPath(requested) ?? DEFAULT_POST_AUTH_PATH;
  if (dbEnabled() && !user.nickname) {
    return `/entrar/apelido?redirect=${encodeURIComponent(dest)}`;
  }
  return dest;
}
