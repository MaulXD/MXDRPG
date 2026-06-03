import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { moveRoomToken } from "@/lib/room/store";
import { activeTokenId } from "@/lib/room/combat";
import { getRoomSnapshot } from "@/lib/room/store";
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

  if (session) {
    const isOwner = token.ownerRole === "jogador" && session.user.role === "jogador";
    const isMestre = session.user.role === "mestre" || session.user.role === "admin";
    if (!isOwner && !isMestre) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
  }

  const canBypass = session?.user.role === "mestre" || session?.user.role === "admin";
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
