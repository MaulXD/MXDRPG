import { NextResponse } from "next/server";
import type { BattleToken } from "@/lib/vtt/types";
import { canMoveToken } from "@/lib/auth/authorize-room";
import { getSession } from "@/lib/auth/session";
import { getRoom, getRoomSnapshot, updateRoomToken } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string; tokenId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  const { roomId, tokenId } = await params;

  const snapshotBefore = await getRoomSnapshot(roomId);
  if (!snapshotBefore) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const token = snapshotBefore.scene.tokens.find((t) => t.id === tokenId);
  if (!token) {
    return NextResponse.json({ error: "Token não encontrado" }, { status: 404 });
  }

  const body = (await req.json()) as Partial<BattleToken>;

  const room = await getRoom(roomId);
  if (session && room) {
    if (!canMoveToken(room, session.user, token)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
  }

  const snapshot = await updateRoomToken(roomId, tokenId, body);
  if (!snapshot) {
    return NextResponse.json({ error: "Falha ao atualizar token" }, { status: 500 });
  }

  return NextResponse.json({
    token: snapshot.scene.tokens.find((t) => t.id === tokenId),
    revision: snapshot.revision,
  });
}
