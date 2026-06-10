import { NextResponse } from "next/server";
import { ensureAdventureMembership } from "@/lib/adventure/store";
import { backfillPlayerBestiaryFromRoomChat } from "@/lib/bestiary/backfill";
import { buildPlayerBestiaryEntryViews } from "@/lib/bestiary/player-view";
import { getSession } from "@/lib/auth/session";
import { listPlayerBestiaryEntries } from "@/lib/db/player-bestiary";
import { getRoom } from "@/lib/room/internal/registry";

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

  const roomId = new URL(req.url).searchParams.get("roomId")?.trim();
  if (!roomId) {
    return NextResponse.json({ error: "roomId é obrigatório" }, { status: 400 });
  }

  const room = await getRoom(roomId);
  if (!room || (room.adventureId ?? room.roomId) !== adventureId) {
    return NextResponse.json({ error: "Sala inválida" }, { status: 400 });
  }

  await backfillPlayerBestiaryFromRoomChat(room);

  const entries = await listPlayerBestiaryEntries(session.user.id, adventureId);
  const views = buildPlayerBestiaryEntryViews(entries);

  return NextResponse.json({ bestiary: { entries: views } });
}
