import type { SessionUser } from "@/lib/auth/types";
import {
  needsProfileOnboarding,
  profileOnboardingPath,
} from "@/lib/auth/profile-onboarding";

import { MESAS_HUB_PATH } from "@/lib/rpg/systems";

/** Destino padrão após login/cadastro — hub MXDRPG. */
export const DEFAULT_POST_AUTH_PATH = MESAS_HUB_PATH;

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

/** Após autenticação: perfil (apelido + foto) no primeiro acesso, depois destino pedido. */
export function postAuthRedirect(user: SessionUser, requested?: string | null): string {
  const dest = safeRedirectPath(requested) ?? DEFAULT_POST_AUTH_PATH;
  if (needsProfileOnboarding(user)) {
    return profileOnboardingPath(dest);
  }
  return dest;
}

export { profileOnboardingPath, apelidoPathWithRedirect } from "@/lib/auth/profile-onboarding";
