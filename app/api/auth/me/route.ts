import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { safeMaterializeSessionUser } from "@/lib/auth/session-user";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  const user = await safeMaterializeSessionUser(session.user);
  return NextResponse.json({ user });
}
