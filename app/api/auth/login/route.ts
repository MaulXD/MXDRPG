import { NextResponse } from "next/server";
import { isClerkEnabled } from "@/lib/auth/clerk-config";
import { dbEnabled } from "@/lib/db/enabled";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { portalPathForRole } from "@/lib/auth/roles";
import { postAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { createSession } from "@/lib/auth/session";
import { loginUser } from "@/lib/auth/user-store";

export async function POST(request: Request) {
  if (isClerkEnabled()) {
    return NextResponse.json(
      { error: "Login local desativado. Use /sign-in (Google ou Discord)." },
      { status: 410 }
    );
  }

  if (dbEnabled()) {
    try {
      await ensureDbMigrations();
    } catch {
      /* login ainda tenta memória local se DB falhar */
    }
  }

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
