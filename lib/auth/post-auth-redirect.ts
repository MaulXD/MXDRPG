import { dbEnabled } from "@/lib/db/enabled";
import type { SessionUser } from "@/lib/auth/types";

/** Destino padrão após login/cadastro — mesas Eldarin. */
export const DEFAULT_POST_AUTH_PATH = "/eldarin";

export function safeRedirectPath(raw: string | undefined | null): string | null {
  const t = (raw ?? "").trim();
  if (!t.startsWith("/") || t.startsWith("//")) return null;
  return t;
}

/** Caminho da mesa, com código de convite opcional na query. */
export function mesaRoomPath(roomId: string, inviteCode?: string | null): string {
  const base = `/mesa/${roomId}`;
  const code = inviteCode?.trim();
  if (!code) return base;
  return `${base}?invite=${encodeURIComponent(code)}`;
}

/** URL de login com destino pós-auth (inclui query no destino, ex. `?invite=`). */
export function signInPath(dest: string): string {
  const safe = safeRedirectPath(dest) ?? DEFAULT_POST_AUTH_PATH;
  return `/entrar?redirect=${encodeURIComponent(safe)}`;
}

/** @deprecated Use signInPath — mantido para links antigos que redirecionam via /entrar. */
export function entrarPath(dest: string): string {
  return signInPath(dest);
}

/** Após autenticação: apelido (se Postgres) e depois mesas ou URL pedida. */
export function postAuthRedirect(user: SessionUser, requested?: string | null): string {
  const dest = safeRedirectPath(requested) ?? DEFAULT_POST_AUTH_PATH;
  if (dbEnabled() && !user.nickname) {
    return `/entrar/apelido?redirect=${encodeURIComponent(dest)}`;
  }
  return dest;
}

/** Caminho do fluxo de apelido preservando destino final. */
export function apelidoPathWithRedirect(dest: string): string {
  const safe = safeRedirectPath(dest) ?? DEFAULT_POST_AUTH_PATH;
  if (safe === DEFAULT_POST_AUTH_PATH) return "/entrar/apelido";
  return `/entrar/apelido?redirect=${encodeURIComponent(safe)}`;
}
