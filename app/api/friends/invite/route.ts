import { NextResponse } from "next/server";
import {
  sendMesaInviteByNickname,
  sendMesaInviteToFriend,
  sendMesaInviteToUser,
} from "@/lib/friends/store";
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
  const userId = String(body.userId ?? "").trim();
  const nickname = String(body.nickname ?? "").trim();
  const adventureId = String(body.adventureId ?? "").trim();
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 280) : "";

  if (!adventureId) {
    return NextResponse.json({ error: "Mesa é obrigatória" }, { status: 400 });
  }
  if (!friendId && !userId && !nickname) {
    return NextResponse.json({ error: "Informe o amigo, apelido ou jogador" }, { status: 400 });
  }

  const opts = { message: message || undefined, clerkId: session.user.clerkId };
  const result = nickname
    ? await sendMesaInviteByNickname(session.user.id, nickname, adventureId, opts)
    : userId
      ? await sendMesaInviteToUser(session.user.id, userId, adventureId, opts)
      : await sendMesaInviteToFriend(session.user.id, friendId, adventureId, opts);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ invite: result.invite });
}
