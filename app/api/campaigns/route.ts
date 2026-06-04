import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createRoom, listRoomsForUser } from "@/lib/room/store";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const rooms = await listRoomsForUser(session.user.id);
  return NextResponse.json({ rooms });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Nome da mesa obrigatório" }, { status: 400 });
  }

  const room = await createRoom(session.user.id, name);
  return NextResponse.json({
    room: {
      roomId: room.roomId,
      name: room.name,
      inviteCode: room.inviteCode,
      isOwner: true,
    },
  });
}
