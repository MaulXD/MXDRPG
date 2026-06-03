import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canEditCharacter, getCharacter } from "@/lib/character/characters";
import { getRoomActor, updateRoomActor } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string; actorId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { roomId, actorId } = await params;
  const actor = getRoomActor(roomId, actorId);
  if (!actor) {
    return NextResponse.json({ error: "Personagem não encontrado na sala" }, { status: 404 });
  }
  return NextResponse.json(actor);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { roomId, actorId } = await params;
  const seed = getCharacter(actorId);
  if (!seed) {
    return NextResponse.json({ error: "Personagem inválido" }, { status: 404 });
  }

  if (!canEditCharacter(seed, session.user.id, session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const snapshot = updateRoomActor(roomId, actorId, body);
  if (!snapshot) {
    return NextResponse.json({ error: "Sala ou personagem não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    actor: snapshot.actors[actorId],
    revision: snapshot.revision,
  });
}
