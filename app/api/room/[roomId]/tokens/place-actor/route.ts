import { NextResponse } from "next/server";
import { canManageRoom, canPlaceRoomActorOnBoard } from "@/lib/auth/room-access";
import { getSession } from "@/lib/auth/session";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { getRoom, placeRoomActorOnCell } from "@/lib/room/store";
import { isActorDowned, isTokenDowned } from "@/lib/vtt/player-tokens";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  actorId?: string;
  q?: number;
  r?: number;
};

export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await getSession();
  const room = await getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const body = (await req.json()) as Body;
  const actorId = body.actorId?.trim();
  if (!actorId || body.q == null || body.r == null) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const actor = room.actors[actorId];
  if (!actor) {
    return NextResponse.json({ error: "Personagem não encontrado na aventura" }, { status: 404 });
  }

  const user = session?.user ?? null;
  if (!canPlaceRoomActorOnBoard(room, actor, user)) {
    return NextResponse.json({ error: "Sem permissão para posicionar este personagem" }, { status: 403 });
  }

  if (!canManageRoom(room, user)) {
    const existing = room.scene.tokens.find((t) => t.linked && t.actorId === actorId);
    if (isActorDowned(actor) || (existing && isTokenDowned(existing))) {
      return NextResponse.json(
        { error: "Personagem inconsciente não pode entrar no mapa" },
        { status: 400 }
      );
    }
  }

  const result = await placeRoomActorOnCell(roomId, actorId, { q: body.q, r: body.r });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(snapshotForViewer(result.snapshot, room, session?.user ?? null));
}
