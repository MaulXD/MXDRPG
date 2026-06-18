import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function POST() {
  await destroySession();
  const target = "/entrar";
  return NextResponse.json({ ok: true, redirect: target });
}
