import { isClerkEnabled } from "@/lib/auth/clerk-config";
import { dbSqlReady } from "@/lib/db/sql-ready";
import {
  authAppOrigin,
  oauthProvidersEnabled,
  type OAuthProviderId,
} from "@/lib/auth/oauth-config";

export type AuthCapabilities = {
  /** E-mail/senha + demo (Clerk desligado). */
  emailLogin: boolean;
  oauthProviders: OAuthProviderId[];
  /** Contas sobrevivem restart (MariaDB). */
  persistentAccounts: boolean;
  clerkActive: boolean;
};

function hasOAuthSessionSecret(): boolean {
  const s = process.env.SESSION_SECRET?.trim() || process.env.OAUTH_STATE_SECRET?.trim();
  return Boolean(s && s.length >= 16);
}

function hasPublicAppUrl(): boolean {
  try {
    authAppOrigin();
    return true;
  } catch {
    return false;
  }
}

/** OAuth só aparece na UI quando credenciais + AUTH_URL + SESSION_SECRET existem. */
export function oauthProvidersReady(): OAuthProviderId[] {
  if (!hasOAuthSessionSecret() || !hasPublicAppUrl()) return [];
  return oauthProvidersEnabled();
}

export function getAuthCapabilities(): AuthCapabilities {
  return {
    emailLogin: !isClerkEnabled(),
    oauthProviders: oauthProvidersReady(),
    persistentAccounts: dbSqlReady(),
    clerkActive: isClerkEnabled(),
  };
}

/** Texto curto para /entrar conforme o que o servidor oferece. */
export function authLoginLead(cap: AuthCapabilities): string {
  if (cap.clerkActive) {
    return "Use Google ou Discord — uma conta para mesas, fichas e convites.";
  }
  const parts: string[] = [];
  if (cap.oauthProviders.length > 0) {
    parts.push(
      cap.oauthProviders.includes("google") && cap.oauthProviders.includes("discord")
        ? "Google, Discord"
        : cap.oauthProviders.includes("google")
          ? "Google"
          : "Discord"
    );
  }
  parts.push("e-mail e senha");
  const methods = parts.join(" ou ");
  if (!cap.persistentAccounts) {
    return `${methods} — contas demo sempre disponíveis; cadastros novos exigem banco configurado no servidor.`;
  }
  return `Entre com ${methods} — uma conta para mesas, fichas e convites.`;
}
