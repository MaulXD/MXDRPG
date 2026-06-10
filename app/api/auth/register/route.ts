import { NextResponse } from "next/server";

/** Cadastro local desativado — use Clerk (/sign-up). */
export async function POST() {
  return NextResponse.json(
    { error: "Cadastro local desativado. Use /sign-up (Google ou Discord)." },
    { status: 410 }
  );
}
