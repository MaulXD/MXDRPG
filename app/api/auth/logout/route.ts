import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function POST() {
  await destroySession();
  const target = "/sign-in";
  return NextResponse.json({ ok: true, redirect: target });
}
