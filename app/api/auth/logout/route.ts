import { NextResponse } from "next/server";
import { isClerkEnabled } from "@/lib/auth/clerk-config";
import { destroySession } from "@/lib/auth/session";

export async function POST() {
  await destroySession();
  const target = isClerkEnabled() ? "/sign-in" : "/entrar";
  return NextResponse.json({ ok: true, redirect: target });
}
