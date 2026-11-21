import { NextResponse } from "next/server";
import type { BattleToken } from "@/lib/vtt/types";
import { canMoveToken } from "@/lib/auth/authorize-room";
import { canRemoveTokenFromBoard } from "@/lib/auth/room-access";
import { canApplyTokenConditions } from "@/lib/auth/room-access";
import { getSession } from "@/lib/auth/session";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { getRoom, removeRoomToken, updateRoomToken } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string; tokenId: string }> };

/** Campos que o dono do token muda sem o mestre: só aparência. */
const PLAYER_TOKEN_PATCH_KEYS = new Set(["imageUrl", "imageFocus", "nameplateMode"]);

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  const { roomId, tokenId } = await params;

  const room = await getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const token = room.scene.tokens.find((t) => t.id === tokenId);
  if (!token) {
    return NextResponse.json({ error: "Token não encontrado" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as Partial<BattleToken> | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  // ROTA-TOKEN: antes, sem sessão nada era conferido (qualquer um mudava vida, PA ou
  // posição do token) e o jogador podia mandar qualquer campo do próprio token.
  // Movimento, ataque e PA têm rotas próprias que validam no servidor; aqui o único
  // cliente é o painel de condições do mestre.
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  const isGm = canApplyTokenConditions(room, session.user);
  if (!isGm) {
    if (body.conditions !== undefined || body.timedEffects !== undefined) {
      return NextResponse.json(
        { error: "Só o mestre pode aplicar condições de status" },
        { status: 403 }
      );
    }
    if (!canMoveToken(room, session.user, token)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const blocked = Object.keys(body).filter((k) => !PLAYER_TOKEN_PATCH_KEYS.has(k));
    if (blocked.length) {
      return NextResponse.json(
        { error: `Só o mestre altera isso no token: ${blocked.join(", ")}` },
        { status: 403 }
      );
    }
  }

  const snapshot = await updateRoomToken(roomId, tokenId, body, { room });
  if (!snapshot) {
    return NextResponse.json({ error: "Falha ao atualizar token" }, { status: 500 });
  }

  return NextResponse.json({
    token: snapshot.scene.tokens.find((t) => t.id === tokenId),
    revision: snapshot.revision,
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { roomId, tokenId } = await params;
  const session = await getSession();
  const room = await getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const token = room.scene.tokens.find((t) => t.id === tokenId);
  if (!token) {
    return NextResponse.json({ error: "Token não encontrado" }, { status: 404 });
  }

  if (!canRemoveTokenFromBoard(room, session?.user ?? null, token)) {
    return NextResponse.json(
      { error: "Sem permissão para retirar este token do mapa" },
      { status: 403 }
    );
  }

  const result = await removeRoomToken(roomId, tokenId, { room });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    snapshotForViewer(result.snapshot, room, session?.user ?? null)
  );
}
