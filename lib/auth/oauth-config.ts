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
