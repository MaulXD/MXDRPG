import { NextResponse } from "next/server";
import { dismissReceivedMesaInvite } from "@/lib/friends/store";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ inviteId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const { inviteId } = await params;
  const result = await dismissReceivedMesaInvite(session.user.id, inviteId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
