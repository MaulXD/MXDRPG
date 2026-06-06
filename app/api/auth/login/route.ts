import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/user-store";
import { portalPathForRole } from "@/lib/auth/roles";
import { postAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json();
  const login = String(body.login ?? body.email ?? "").trim();
  const password = String(body.password ?? "");
  const redirect = String(body.redirect ?? "").trim() || undefined;

  const user = await authenticateUser(login, password);
  if (!user) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  await createSession(user);

  const target =
    user.role === "admin" && !redirect
      ? portalPathForRole(user.role)
      : postAuthRedirect(user, redirect);

  return NextResponse.json({ ok: true, role: user.role, redirect: target });
}
