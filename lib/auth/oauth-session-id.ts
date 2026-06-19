import type { OAuthProviderId } from "@/lib/auth/oauth-config";

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
