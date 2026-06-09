import { NextResponse } from "next/server";
import { sendMesaInviteToFriend } from "@/lib/friends/store";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const friendId = String(body.friendId ?? "").trim();
  const adventureId = String(body.adventureId ?? "").trim();
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 280) : "";

  if (!friendId || !adventureId) {
    return NextResponse.json({ error: "Amigo e mesa são obrigatórios" }, { status: 400 });
  }

  const result = await sendMesaInviteToFriend(session.user.id, friendId, adventureId, {
    message: message || undefined,
    clerkId: session.user.clerkId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ invite: result.invite });
}
