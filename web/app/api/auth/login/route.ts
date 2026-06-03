import { NextResponse } from "next/server";
import { authenticateDemo } from "@/lib/auth/demo-users";
import { portalPathForRole } from "@/lib/auth/roles";
import { createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  const redirect = String(body.redirect ?? "");

  const user = authenticateDemo(email, password);
  if (!user) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  await createSession(user);

  const target =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : portalPathForRole(user.role);

  return NextResponse.json({ ok: true, role: user.role, redirect: target });
}
