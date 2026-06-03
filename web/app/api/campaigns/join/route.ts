import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { joinRoomByInvite } from "@/lib/room/store";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const body = await request.json();
  const inviteCode = String(body.inviteCode ?? "").trim();
  if (!inviteCode) {
    return NextResponse.json({ error: "Código de convite obrigatório" }, { status: 400 });
  }

  const room = joinRoomByInvite(inviteCode, session.user.id);
  if (!room) {
    return NextResponse.json({ error: "Código inválido ou mesa não encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    room: {
      roomId: room.roomId,
      name: room.name,
      inviteCode: room.inviteCode,
      isOwner: room.ownerId === session.user.id,
    },
  });
}
