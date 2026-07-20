import { NextResponse } from "next/server";
import { actorForRoomAuth, canEditRoomActor } from "@/lib/auth/room-access";
import { getSession } from "@/lib/auth/session";
import { canLevelUp, validateLevelUpChoices, type LevelUpChoices } from "@/lib/character/level-up";
import { resolveCharacter } from "@/lib/character/characters";
import { getRoom, getRoomActor, levelUpRoomActor, addRoomChatMessage } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string; actorId: string }> };

export async function POST(req: Request, { params }: Params) {
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

  const current = await getRoomActor(roomId, actorId, { room });
  const actorForAuth = actorForRoomAuth(room, { ...seed, ...current });

  if (!canEditRoomActor(room, actorForAuth, session?.user ?? null)) {
    return NextResponse.json({ error: "Sem permissão para editar esta ficha" }, { status: 403 });
  }

  if (!current) {
    return NextResponse.json({ error: "Personagem não está na sala" }, { status: 404 });
  }

  if (!canLevelUp(current)) {
    return NextResponse.json({ error: "XP insuficiente ou nível máximo" }, { status: 400 });
  }

  let choices: LevelUpChoices = {};
  try {
    const body = await req.json();
    if (body && typeof body === "object") choices = body as LevelUpChoices;
  } catch {
    /* body vazio ok se não houver escolhas */
  }

  const err = validateLevelUpChoices(current, choices);
  if (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }

  const snapshot = await levelUpRoomActor(roomId, actorId, choices, { room });
  if (!snapshot) {
    return NextResponse.json({ error: "Falha ao subir nível" }, { status: 500 });
  }

  const actor = snapshot.actors[actorId];
  await addRoomChatMessage(roomId, {
    authorId: "system",
    authorName: "Sistema",
    authorRole: "mestre",
    kind: "chat",
    text: `${actor.name} subiu para nível ${actor.identity.nivel}${actor.identity.subclasse ? ` · ${actor.identity.subclasse}` : ""}.`,
  });

  return NextResponse.json({
    actor: snapshot.actors[actorId],
    scene: snapshot.scene,
    revision: snapshot.revision,
  });
}
