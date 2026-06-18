import { NextResponse } from "next/server";
import { saveRecoveryIdentityForUser } from "@/lib/auth/password-recover";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const cpfPrefix = String(body.cpfPrefix ?? "");
  const birthDate = String(body.birthDate ?? "");

  const result = await saveRecoveryIdentityForUser(session.user.id, { cpfPrefix, birthDate });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
