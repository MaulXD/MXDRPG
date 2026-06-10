import { NextResponse } from "next/server";
import { createAdventure, listAdventuresForUser } from "@/lib/adventure/store";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_RPG_SYSTEM_ID } from "@/lib/rpg/systems";

/** Compat: responde `rooms` mapeando aventuras (mesa = primaryRoomId). */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  const adventures = await listAdventuresForUser(session.user.id, {
    rpgSystemId: DEFAULT_RPG_SYSTEM_ID,
  });
  return NextResponse.json({
    rooms: adventures.map((a) => ({
      roomId: a.primaryRoomId,
      adventureId: a.adventureId,
      name: a.name,
      inviteCode: a.inviteCode,
      isOwner: a.isOwner,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Nome da aventura obrigatório" }, { status: 400 });
  }
  const result = await createAdventure(session.user.id, name, {
    rpgSystemId: DEFAULT_RPG_SYSTEM_ID,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const { adventure } = result;
  return NextResponse.json({
    room: {
      roomId: adventure.primaryRoomId,
      adventureId: adventure.adventureId,
      name: adventure.name,
      inviteCode: adventure.inviteCode,
      isOwner: true,
    },
  });
}
