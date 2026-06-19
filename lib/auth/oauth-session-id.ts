import type { OAuthProviderId } from "@/lib/auth/oauth-config";
import type { SessionUser } from "@/lib/auth/types";

/** Id de sessão efêmera quando o DB falhou no login OAuth (`google-…` / `discord-…`). */
export function parseOAuthEphemeralSessionId(
  id: string
): { provider: OAuthProviderId; subject: string } | null {
  const m = /^(google|discord)-(.+)$/.exec(id.trim());
  if (!m) return null;
  return { provider: m[1] as OAuthProviderId, subject: m[2]! };
}

export function isOAuthEphemeralSessionId(id: string): boolean {
  return parseOAuthEphemeralSessionId(id) !== null;
}

/** Recupera identidade OAuth gravada na sessão ou codificada no id efêmero. */
export function oauthIdentityFromSession(
  user: Pick<SessionUser, "id" | "oauthProvider" | "oauthSubject">
): { provider: OAuthProviderId; subject: string } | null {
  const provider = user.oauthProvider;
  const subject = user.oauthSubject?.trim();
  if (provider && subject) return { provider, subject };
  return parseOAuthEphemeralSessionId(user.id);
}
