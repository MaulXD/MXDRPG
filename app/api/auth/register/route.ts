import { isClerkEnabled } from "@/lib/auth/clerk-config";
import { registerUser } from "@/lib/auth/user-store";
import { postAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { createSession } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (isClerkEnabled()) {
    return NextResponse.json(
      { error: "Cadastro local desativado. Use /sign-in (Google ou Discord)." },
      { status: 410 }
    );
  }

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
    redirect: postAuthRedirect(result.user, redirect),
  });
}
