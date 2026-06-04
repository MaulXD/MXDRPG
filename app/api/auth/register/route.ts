import { NextResponse } from "next/server";
import { portalPathForRole } from "@/lib/auth/roles";
import { createSession } from "@/lib/auth/session";
import { registerUser } from "@/lib/auth/user-store";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim();
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");

  const nickname = String(body.nickname ?? "").trim() || undefined;
  const result = await registerUser(email, name, password, nickname);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await createSession(result.user);

  return NextResponse.json({
    ok: true,
    redirect: portalPathForRole(result.user.role),
  });
}
