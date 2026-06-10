import { NextResponse } from "next/server";
import { actorForRoomAuth, canEditRoomActor } from "@/lib/auth/room-access";
import { canEditRoomActorPortrait, isPortraitOnlyPatch } from "@/lib/auth/portrait-access";
import { getSession } from "@/lib/auth/session";
import { resolveCharacter } from "@/lib/character/characters";
import { getRoom, getRoomActor, updateRoomActor } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string; actorId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { roomId, actorId } = await params;
  const actor = await getRoomActor(roomId, actorId);
  if (!actor) {
    return NextResponse.json({ error: "Personagem não encontrado na sala" }, { status: 404 });
  }
  return NextResponse.json(actor);
}

export async function PATCH(req: Request, { params }: Params) {
  const { roomId, actorId } = await params;
  const session = await getSession();
  const room = await getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const seed = await resolveCharacter(actorId);
  if (!seed) {
    return NextResponse.json({ error: "Personagem inválido" }, { status: 404 });
  }

  const live = await getRoomActor(roomId, actorId);
  const actorForAuth = actorForRoomAuth(room, { ...seed, ...live });

  const body = (await req.json()) as Record<string, unknown>;
  const user = session?.user ?? null;
  const canEdit = canEditRoomActor(room, actorForAuth, user);
  const canPortrait =
    isPortraitOnlyPatch(body) && canEditRoomActorPortrait(room, actorForAuth, user);
  if (!canEdit && !canPortrait) {
    return NextResponse.json({ error: "Sem permissão para editar esta ficha" }, { status: 403 });
  }
  const snapshot = await updateRoomActor(roomId, actorId, body);
  if (!snapshot) {
    return NextResponse.json({ error: "Sala ou personagem não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    actor: snapshot.actors[actorId],
    revision: snapshot.revision,
  });
}
