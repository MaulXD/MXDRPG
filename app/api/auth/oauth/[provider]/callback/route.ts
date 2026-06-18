import { NextResponse } from "next/server";
import {
  isOAuthProviderConfigured,
  parseOAuthProvider,
} from "@/lib/auth/oauth-config";
import { completeOAuthLogin, oauthErrorRedirect } from "@/lib/auth/oauth/complete-login";
import { resolveOAuthProfile } from "@/lib/auth/oauth/providers";
import { consumeOAuthState } from "@/lib/auth/oauth/state";

type Params = { params: Promise<{ provider: string }> };

/** Callback OAuth — valida state, cria sessão, redireciona. */
export async function GET(request: Request, { params }: Params) {
  const { provider: raw } = await params;
  const provider = parseOAuthProvider(raw);
  if (!provider || !isOAuthProviderConfigured(provider)) {
    return oauthErrorRedirect("oauth_unconfigured");
  }

  const url = new URL(request.url);
  const err = url.searchParams.get("error");
  if (err) {
    return oauthErrorRedirect("oauth_denied", err);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return oauthErrorRedirect("oauth_invalid");
  }

  const pending = await consumeOAuthState(provider, state);
  if (!pending) {
    return oauthErrorRedirect("oauth_state");
  }

  try {
    const profile = await resolveOAuthProfile(provider, code);
    return completeOAuthLogin(profile, pending.redirect);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha no login social";
    console.error("[oauth callback]", provider, msg);
    return oauthErrorRedirect("oauth_failed", msg);
  }
}
