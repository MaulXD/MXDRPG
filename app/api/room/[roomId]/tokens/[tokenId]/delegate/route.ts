import { NextResponse } from "next/server";
import { characterOwnedBySessionUser } from "@/lib/auth/account-ownership";
import { canManageRoom } from "@/lib/auth/room-access";
import { memberIdsHasUser } from "@/lib/auth/member-ids";
import { canParticipateInRoomSession } from "@/lib/auth/mesa-watch-session";
import { getSession } from "@/lib/auth/session";
import { getRoom, updateRoomToken } from "@/lib/room/store";
import { isMonsterToken } from "@/lib/room/settings";

type Params = { params: Promise<{ roomId: string; tokenId: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { roomId, tokenId } = await params;
  const room = await getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  if (!(await canParticipateInRoomSession(room, session.user))) {
    return NextResponse.json({ error: "Modo só assistir" }, { status: 403 });
  }

  const token = room.scene.tokens.find((t) => t.id === tokenId);
  if (!token) {
    return NextResponse.json({ error: "Token não encontrado" }, { status: 404 });
  }
  if (isMonsterToken(token)) {
    return NextResponse.json({ error: "Só tokens de personagem podem ser delegados" }, { status: 400 });
  }

  const isGm = canManageRoom(room, session.user);
  let isOwner = false;
  if (token.linked && token.actorId) {
    const actor = room.actors[token.actorId];
    if (actor) isOwner = characterOwnedBySessionUser(actor, session.user);
  }
  if (!isGm && !isOwner) {
    return NextResponse.json({ error: "Sem permissão para delegar este token" }, { status: 403 });
  }

  const body = (await req.json()) as { userId?: string | null };
  const targetRaw = body.userId;
  const delegatedToUserId =
    targetRaw == null || String(targetRaw).trim() === "" ? null : String(targetRaw).trim();

  if (delegatedToUserId) {
    if (
      !memberIdsHasUser(room.memberIds ?? [], delegatedToUserId) &&
      room.ownerId !== delegatedToUserId
    ) {
      return NextResponse.json({ error: "Usuário não é membro desta mesa" }, { status: 400 });
    }
    if (delegatedToUserId === session.user.id && !isGm) {
      return NextResponse.json({ error: "Use outro jogador como piloto" }, { status: 400 });
    }
  }

  const snapshot = await updateRoomToken(roomId, tokenId, { delegatedToUserId }, { room });
  if (!snapshot) {
    return NextResponse.json({ error: "Falha ao delegar" }, { status: 500 });
  }

  return NextResponse.json({
    token: snapshot.scene.tokens.find((t) => t.id === tokenId),
    revision: snapshot.revision,
  });
}
