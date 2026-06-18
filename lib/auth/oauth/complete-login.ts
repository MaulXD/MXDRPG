import { NextResponse } from "next/server";
import { postAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { createSession } from "@/lib/auth/session";
import { ensureUserFromOAuth } from "@/lib/db/users";
import type { OAuthProfile } from "@/lib/auth/oauth/providers";
import { authAppOrigin } from "@/lib/auth/oauth-config";

export async function completeOAuthLogin(
  profile: OAuthProfile,
  redirect: string
): Promise<NextResponse> {
  const user = await ensureUserFromOAuth({
    provider: profile.provider,
    subject: profile.subject,
    email: profile.email,
    name: profile.name,
    oauthAvatarUrl: profile.oauthAvatarUrl,
  });
  await createSession(user);
  const target = postAuthRedirect(user, redirect);
  return NextResponse.redirect(new URL(target, authAppOrigin()));
}

export function oauthErrorRedirect(code: string, detail?: string): NextResponse {
  const url = new URL("/entrar", authAppOrigin());
  url.searchParams.set("error", code);
  if (detail) url.searchParams.set("msg", detail.slice(0, 120));
  return NextResponse.redirect(url);
}
