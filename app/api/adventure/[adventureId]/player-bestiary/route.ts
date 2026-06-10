import { NextResponse } from "next/server";
import { ensureAdventureMembership } from "@/lib/adventure/store";
import { backfillPlayerBestiaryFromRoomChat } from "@/lib/bestiary/backfill";
import { buildPlayerBestiaryGmView } from "@/lib/bestiary/player-view";
import { canManageRoom } from "@/lib/auth/room-access";
import { getSession } from "@/lib/auth/session";
import { listPlayerBestiaryEntries } from "@/lib/db/player-bestiary";
import { fetchUserById } from "@/lib/db/users";
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

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId")?.trim();
  const roomId = url.searchParams.get("roomId")?.trim();
  const tokenId = url.searchParams.get("tokenId")?.trim();
  if (!userId || !roomId) {
    return NextResponse.json({ error: "userId e roomId são obrigatórios" }, { status: 400 });
  }

  const room = await getRoom(roomId);
  if (!room || (room.adventureId ?? room.roomId) !== adventureId) {
    return NextResponse.json({ error: "Sala inválida" }, { status: 400 });
  }

  if (!canManageRoom(room, session.user)) {
    return NextResponse.json({ error: "Somente o mestre pode ver o bestiário do jogador" }, { status: 403 });
  }

  let characterName = "Personagem";
  if (tokenId) {
    const token = room.scene.tokens.find((t) => t.id === tokenId);
    const actor = token?.actorId ? room.actors[token.actorId] : null;
    if (actor?.ownerId === userId) {
      characterName = actor.name?.trim() || token?.name?.trim() || characterName;
    }
  }

  await backfillPlayerBestiaryFromRoomChat(room);

  const entries = await listPlayerBestiaryEntries(userId, adventureId);
  const profile = await fetchUserById(userId);
  const playerName =
    profile?.nickname?.trim() || profile?.name?.trim() || "Jogador";

  const bestiary = buildPlayerBestiaryGmView({
    playerUserId: userId,
    playerName,
    characterName,
    entries,
  });

  return NextResponse.json({ bestiary });
}
