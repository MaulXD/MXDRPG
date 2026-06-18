import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  isOAuthProviderReady,
  parseOAuthProvider,
} from "@/lib/auth/oauth-config";
import { buildAuthorizationUrl } from "@/lib/auth/oauth/providers";
import { beginOAuthState, oauthStateCookieOptions } from "@/lib/auth/oauth/state";
import { oauthErrorRedirect } from "@/lib/auth/oauth/complete-login";

type Params = { params: Promise<{ provider: string }> };

/** Inicia login OAuth — redireciona para Google ou Discord. */
export async function GET(request: Request, { params }: Params) {
  const { provider: raw } = await params;
  const provider = parseOAuthProvider(raw);
  if (!provider || !isOAuthProviderReady(provider)) {
    return oauthErrorRedirect("oauth_unconfigured");
  }

  const url = new URL(request.url);
  const redirect = url.searchParams.get("redirect");

  try {
    const { state, setCookie } = await beginOAuthState(provider, redirect);
    const store = await cookies();
    store.set(oauthStateCookieOptions(setCookie));
    const authUrl = buildAuthorizationUrl(provider, state);
    return NextResponse.redirect(authUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao iniciar OAuth";
    return oauthErrorRedirect("oauth_start", msg);
  }
}
