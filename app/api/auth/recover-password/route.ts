import { NextResponse } from "next/server";
import { checkPasswordRecovery, recoverPassword } from "@/lib/auth/password-recover";

export async function POST(request: Request) {
  const body = await request.json();
  const action = String(body.action ?? "reset").trim();

  if (action === "check") {
    const email = String(body.email ?? "").trim();
    const result = await checkPasswordRecovery(email);
    return NextResponse.json(result);
  }

  const email = String(body.email ?? "").trim();
  const cpfPrefix = String(body.cpfPrefix ?? "");
  const birthDate = String(body.birthDate ?? "");
  const password = String(body.password ?? "");
  const passwordConfirm = String(body.passwordConfirm ?? "");

  if (password !== passwordConfirm) {
    return NextResponse.json({ error: "As senhas não coincidem." }, { status: 400 });
  }

  const result = await recoverPassword(email, { cpfPrefix, birthDate }, password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
