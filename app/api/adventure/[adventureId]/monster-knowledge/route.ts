import { NextResponse } from "next/server";
import { ensureAdventureMembership } from "@/lib/adventure/store";
import { backfillPlayerBestiaryFromRoomChat } from "@/lib/bestiary/backfill";
import { monsterTypeKey } from "@/lib/bestiary/monster-identity";
import { buildPlayerMonsterKnowledgeView } from "@/lib/bestiary/player-view";
import { loadPlayerBestiaryEntry } from "@/lib/db/player-bestiary";
import { canManageRoom } from "@/lib/auth/room-access";
import { getSession } from "@/lib/auth/session";
import { getRoom } from "@/lib/room/internal/registry";
import { isMonsterToken } from "@/lib/room/settings";

type Params = { params: Promise<{ adventureId: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const { adventureId } = await params;
  const adv = await ensureAdventureMembership(adventureId, session.user.id);
  if (!adv) {
    return NextResponse.json({ error: "Aventura não encontrada" }, { status: 404 });
  }

  const url = new URL(req.url);
  const tokenId = url.searchParams.get("tokenId")?.trim();
  const roomId = url.searchParams.get("roomId")?.trim();
  if (!tokenId || !roomId) {
    return NextResponse.json({ error: "tokenId e roomId são obrigatórios" }, { status: 400 });
  }

  const room = await getRoom(roomId);
  if (!room || (room.adventureId ?? room.roomId) !== adventureId) {
    return NextResponse.json({ error: "Sala inválida" }, { status: 400 });
  }

  const simulatePlayerView = url.searchParams.get("simulatePlayerView") === "1";
  const isGm = canManageRoom(room, session.user);
  if (isGm && !simulatePlayerView) {
    return NextResponse.json({ error: "Disponível apenas para jogadores" }, { status: 403 });
  }

  const token = room.scene.tokens.find((t) => t.id === tokenId);
  if (!token || !isMonsterToken(token)) {
    return NextResponse.json({ error: "Monstro não encontrado" }, { status: 404 });
  }

  await backfillPlayerBestiaryFromRoomChat(room);

  const typeKey = monsterTypeKey(token);
  const entry = await loadPlayerBestiaryEntry(session.user.id, adventureId, typeKey);
  const view = buildPlayerMonsterKnowledgeView(entry, token.name, typeKey);

  return NextResponse.json({ knowledge: view });
}
