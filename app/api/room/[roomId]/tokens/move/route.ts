import { NextResponse } from "next/server";
import { canManageRoom } from "@/lib/auth/room-access";
import { canMoveToken } from "@/lib/auth/authorize-room";
import { getSession } from "@/lib/auth/session";
import { moveRoomToken, getRoom, getRoomSnapshot } from "@/lib/room/store";
import { activeTokenId } from "@/lib/room/combat";
import type { MoveMode } from "@/lib/vtt/movement";

type Params = { params: Promise<{ roomId: string }> };

type Body = {
  tokenId?: string;
  q?: number;
  r?: number;
  mode?: MoveMode;
  bypassTurn?: boolean;
};

export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await getSession();
  const body = (await req.json()) as Body;

  const tokenId = body.tokenId?.trim();
  if (!tokenId || body.q == null || body.r == null) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const snapshotBefore = getRoomSnapshot(roomId);
  if (!snapshotBefore) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const token = snapshotBefore.scene.tokens.find((t) => t.id === tokenId);
  if (!token) {
    return NextResponse.json({ error: "Token não encontrado" }, { status: 404 });
  }

  const room = getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  if (session) {
    if (!canMoveToken(room, session.user, token)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
  }

  const canBypass = session ? canManageRoom(room, session.user) : false;
  const mode: MoveMode = body.mode === "run" ? "run" : "walk";

  const result = moveRoomToken(
    roomId,
    tokenId,
    { q: body.q, r: body.r },
    mode,
    {
      activeTokenId: activeTokenId(snapshotBefore.combat),
      bypassTurn: Boolean(body.bypassTurn && canBypass),
    }
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.snapshot);
}
