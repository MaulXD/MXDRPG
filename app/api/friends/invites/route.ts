import { NextResponse } from "next/server";
import { listReceivedMesaInvites } from "@/lib/friends/store";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  const invites = await listReceivedMesaInvites(session.user.id);
  return NextResponse.json({ invites });
}
