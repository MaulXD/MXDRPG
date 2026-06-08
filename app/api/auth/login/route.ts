import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth/user-store";
import { portalPathForRole } from "@/lib/auth/roles";
import { postAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json();
  const login = String(body.login ?? body.email ?? "").trim();
  const password = String(body.password ?? "");
  const redirect = String(body.redirect ?? "").trim() || undefined;

  const result = await loginUser(login, password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  await createSession(result.user);

  const target =
    result.user.role === "admin" && !redirect
      ? portalPathForRole(result.user.role)
      : postAuthRedirect(result.user, redirect);

  return NextResponse.json({ ok: true, role: result.user.role, redirect: target });
}
