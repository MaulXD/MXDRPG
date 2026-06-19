import { dbSqlReady } from "@/lib/db/sql-ready";
import {
  authAppOrigin,
  oauthProvidersEnabled,
  type OAuthProviderId,
} from "@/lib/auth/oauth-config";

export type AuthCapabilities = {
  emailLogin: boolean;
  oauthProviders: OAuthProviderId[];
  persistentAccounts: boolean;
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
    emailLogin: true,
    oauthProviders: oauthProvidersReady(),
    persistentAccounts: dbSqlReady(),
  };
}

/** Texto curto para /entrar conforme o que o servidor oferece. */
export function authLoginLead(cap: AuthCapabilities): string {
  if (cap.oauthProviders.length > 0) {
    const social =
      cap.oauthProviders.includes("google") && cap.oauthProviders.includes("discord")
        ? "Google ou Discord"
        : cap.oauthProviders.includes("google")
          ? "Google"
          : "Discord";
    return `Entre com ${social} em um clique — ou use e-mail e senha abaixo.`;
  }
  if (!cap.persistentAccounts) {
    return "E-mail e senha — contas demo sempre disponíveis; cadastros novos exigem MariaDB no servidor.";
  }
  return "Entre com e-mail e senha — uma conta para mesas, fichas e convites.";
}
