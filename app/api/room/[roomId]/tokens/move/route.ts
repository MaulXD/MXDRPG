import { NextResponse } from "next/server";
import { canBypassCombatTurn } from "@/lib/auth/room-access";
import { canParticipateInRoomSession } from "@/lib/auth/mesa-watch-session";
import { canMoveToken } from "@/lib/auth/authorize-room";
import { getSession } from "@/lib/auth/session";
import { mutationDeltaResponse } from "@/lib/room/mutation-response";
import { toSnapshot } from "@/lib/room/internal/registry";
import { moveRoomToken, getRoom } from "@/lib/room/store";
import { activeTokenId } from "@/lib/room/combat";
import { effectiveBypassTurn } from "@/lib/combat/turn-guard";
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

  const room = await getRoom(roomId, { skipAutoPass: true });
  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const snapshotBefore = toSnapshot(room);
  const token = snapshotBefore.scene.tokens.find((t) => t.id === tokenId);
  if (!token) {
    return NextResponse.json({ error: "Token não encontrado" }, { status: 404 });
  }

  if (!(await canParticipateInRoomSession(room, session?.user ?? null))) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  if (!session) {
    return NextResponse.json({ error: "Faça login para mover tokens" }, { status: 401 });
  }

  if (!canMoveToken(room, session.user, token)) {
    return NextResponse.json({ error: "Sem permissão neste token" }, { status: 403 });
  }

  const canBypass = canBypassCombatTurn(room, session?.user ?? null);
  const mode: MoveMode = body.mode === "run" ? "run" : "walk";

  const result = await moveRoomToken(
    roomId,
    tokenId,
    { q: body.q, r: body.r },
    mode,
    {
      activeTokenId: activeTokenId(snapshotBefore.combat),
      bypassTurn: Boolean(body.bypassTurn && token && effectiveBypassTurn(token, canBypass)),
    }
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    mutationDeltaResponse(snapshotBefore, result.snapshot, room, session?.user ?? null)
  );
}
