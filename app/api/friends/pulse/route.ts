import { NextResponse } from "next/server";
import { getFriendsPulse } from "@/lib/friends/pulse";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** P-01: um pedido só para o polling do chat de amigos (não lidas, convites de mesa, pedidos de amizade). */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  const pulse = await getFriendsPulse(session.user.id);
  return NextResponse.json(pulse);
}
