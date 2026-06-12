import { NextResponse } from "next/server";
import { getAdventure } from "@/lib/adventure/store";
import { isAdventureMember } from "@/lib/auth/adventure-access";
import { getSession } from "@/lib/auth/session";
import { resolveCharacterAccount } from "@/lib/auth/account-user";
import { fetchClerkIdForUser, fetchUserById } from "@/lib/db/users";
import { getRoom } from "@/lib/room/internal/registry";

type Params = { params: Promise<{ adventureId: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const { adventureId } = await params;
  const adventure = await getAdventure(adventureId);
  if (!adventure) {
    return NextResponse.json({ error: "Aventura não encontrada" }, { status: 404 });
  }

  const clerkId = session.user.clerkId ?? (await fetchClerkIdForUser(session.user.id));
  if (!isAdventureMember(adventure, session.user.id, clerkId)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const excludeRaw = new URL(req.url).searchParams.get("exclude")?.trim() || null;
  const excludeCanonical = excludeRaw
    ? (await resolveCharacterAccount(excludeRaw)).canonicalId
    : null;

  const room = adventure.primaryRoomId ? await getRoom(adventure.primaryRoomId) : null;
  const rawIds = [
    adventure.ownerId,
    ...adventure.memberIds,
    ...(room ? [room.ownerId, ...room.memberIds] : []),
  ];
  const seen = new Set<string>();
  const members = [];
  for (const rawId of rawIds) {
    if (!rawId?.trim() || seen.has(rawId)) continue;
    const account = await resolveCharacterAccount(rawId);
    const userId = account.canonicalId;
    if (excludeCanonical && userId === excludeCanonical) continue;
    if (seen.has(userId)) continue;
    seen.add(rawId);
    seen.add(userId);
    const user = await fetchUserById(userId);
    members.push({
      userId,
      nickname: user?.nickname ?? null,
      name: user?.name ?? userId,
      isOwner: userId === adventure.ownerId || rawId === adventure.ownerId,
    });
  }

  return NextResponse.json({ members });
}
