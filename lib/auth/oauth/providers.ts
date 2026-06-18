import type { OAuthProviderId } from "@/lib/auth/oauth-config";
import { authAppOrigin, oauthCallbackUrl } from "@/lib/auth/oauth-config";

export type OAuthProfile = {
  provider: OAuthProviderId;
  subject: string;
  email: string;
  name: string;
  oauthAvatarUrl: string | null;
};

function mustEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} não configurado`);
  return v;
}

export function buildAuthorizationUrl(provider: OAuthProviderId, state: string): string {
  const redirectUri = oauthCallbackUrl(provider);
  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: mustEnv("GOOGLE_CLIENT_ID"),
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "online",
      prompt: "select_account",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  const params = new URLSearchParams({
    client_id: mustEnv("DISCORD_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email",
    state,
  });
  return `https://discord.com/api/oauth2/authorize?${params}`;
}

async function exchangeCode(
  provider: OAuthProviderId,
  code: string
): Promise<{ accessToken: string }> {
  const redirectUri = oauthCallbackUrl(provider);
  const body = new URLSearchParams({ code, redirect_uri: redirectUri, grant_type: "authorization_code" });

  if (provider === "google") {
    body.set("client_id", mustEnv("GOOGLE_CLIENT_ID"));
    body.set("client_secret", mustEnv("GOOGLE_CLIENT_SECRET"));
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) throw new Error(`Google token: ${res.status}`);
    const data = (await res.json()) as { access_token?: string };
    if (!data.access_token) throw new Error("Google token ausente");
    return { accessToken: data.access_token };
  }

  body.set("client_id", mustEnv("DISCORD_CLIENT_ID"));
  body.set("client_secret", mustEnv("DISCORD_CLIENT_SECRET"));
  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Discord token: ${res.status}`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Discord token ausente");
  return { accessToken: data.access_token };
}

async function fetchGoogleProfile(accessToken: string): Promise<OAuthProfile> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google userinfo: ${res.status}`);
  const data = (await res.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  if (!data.sub) throw new Error("Google sub ausente");
  const email = data.email?.trim() || `${data.sub}@google.oauth.local`;
  const name = data.name?.trim() || email.split("@")[0] || "Jogador";
  return {
    provider: "google",
    subject: data.sub,
    email,
    name: name.slice(0, 80),
    oauthAvatarUrl: data.picture?.trim() || null,
  };
}

async function fetchDiscordProfile(accessToken: string): Promise<OAuthProfile> {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Discord user: ${res.status}`);
  const data = (await res.json()) as {
    id?: string;
    email?: string;
    username?: string;
    global_name?: string | null;
    avatar?: string | null;
  };
  if (!data.id) throw new Error("Discord id ausente");
  const email = data.email?.trim() || `${data.id}@discord.oauth.local`;
  const name =
    data.global_name?.trim() || data.username?.trim() || email.split("@")[0] || "Jogador";
  let avatar: string | null = null;
  if (data.avatar) {
    avatar = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=128`;
  }
  return {
    provider: "discord",
    subject: data.id,
    email,
    name: name.slice(0, 80),
    oauthAvatarUrl: avatar,
  };
}

export async function resolveOAuthProfile(
  provider: OAuthProviderId,
  code: string
): Promise<OAuthProfile> {
  const { accessToken } = await exchangeCode(provider, code);
  if (provider === "google") return fetchGoogleProfile(accessToken);
  return fetchDiscordProfile(accessToken);
}

/** Para mensagens de erro — não expõe secrets. */
export function oauthProviderLabel(provider: OAuthProviderId): string {
  return provider === "google" ? "Google" : "Discord";
}
