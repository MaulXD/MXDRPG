import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canLevelUp, validateLevelUpChoices, type LevelUpChoices } from "@/lib/character/level-up";
import { canEditCharacter, getCharacter } from "@/lib/character/characters";
import { getRoomActor, levelUpRoomActor, addRoomChatMessage } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string; actorId: string }> };

export async function POST(req: Request, { params }: Params) {
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

  const current = getRoomActor(roomId, actorId);
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

  const snapshot = levelUpRoomActor(roomId, actorId, choices);
  if (!snapshot) {
    return NextResponse.json({ error: "Falha ao subir nível" }, { status: 500 });
  }

  const actor = snapshot.actors[actorId];
  addRoomChatMessage(roomId, {
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
