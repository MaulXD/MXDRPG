import { NextResponse } from "next/server";
import { postAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { createSession } from "@/lib/auth/session";
import { registerUser } from "@/lib/auth/user-store";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim();
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");
  const redirect = String(body.redirect ?? "").trim() || undefined;

  const nickname = String(body.nickname ?? "").trim() || undefined;
  const result = await registerUser(email, name, password, nickname);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await createSession(result.user);

  return NextResponse.json({
    ok: true,
    user: result.user,
    canCreateMesa: true,
    completedSocialAccount: result.completedSocialAccount ?? false,
    redirect: postAuthRedirect(result.user, redirect),
  });
}
