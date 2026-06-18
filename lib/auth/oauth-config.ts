export type OAuthProviderId = "google" | "discord";

const PROVIDERS: OAuthProviderId[] = ["google", "discord"];

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

export function isDiscordOAuthConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_CLIENT_ID?.trim() && process.env.DISCORD_CLIENT_SECRET?.trim()
  );
}

export function isOAuthProviderConfigured(provider: OAuthProviderId): boolean {
  if (provider === "google") return isGoogleOAuthConfigured();
  if (provider === "discord") return isDiscordOAuthConfigured();
  return false;
}

export function oauthProvidersEnabled(): OAuthProviderId[] {
  return PROVIDERS.filter(isOAuthProviderConfigured);
}

/** Provider configurado e infra OAuth pronta (AUTH_URL + SESSION_SECRET). */
export function isOAuthProviderReady(provider: OAuthProviderId): boolean {
  if (!isOAuthProviderConfigured(provider)) return false;
  const secret =
    process.env.SESSION_SECRET?.trim() || process.env.OAUTH_STATE_SECRET?.trim();
  if (!secret || secret.length < 16) return false;
  try {
    authAppOrigin();
    return true;
  } catch {
    return false;
  }
}

export function parseOAuthProvider(raw: string): OAuthProviderId | null {
  const id = raw.trim().toLowerCase();
  if (id === "google" || id === "discord") return id;
  return null;
}

/** URL pública do app (redirect OAuth). */
export function authAppOrigin(): string {
  const raw =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  if (!raw) {
    throw new Error("AUTH_URL ou NEXT_PUBLIC_APP_URL não configurado");
  }
  return raw.replace(/\/$/, "");
}

export function oauthCallbackUrl(provider: OAuthProviderId): string {
  return `${authAppOrigin()}/api/auth/oauth/${provider}/callback`;
}
