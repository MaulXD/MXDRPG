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
  const uniqueRawIds = [...new Set(rawIds.filter((id) => id?.trim()))];
  const accounts = await Promise.all(
    uniqueRawIds.map((rawId) => resolveCharacterAccount(rawId))
  );

  const seenCanonical = new Set<string>();
  const toFetch: Array<{ rawId: string; userId: string }> = [];
  for (let i = 0; i < uniqueRawIds.length; i++) {
    const userId = accounts[i].canonicalId;
    if (excludeCanonical && userId === excludeCanonical) continue;
    if (seenCanonical.has(userId)) continue;
    seenCanonical.add(userId);
    toFetch.push({ rawId: uniqueRawIds[i], userId });
  }

  const users = await Promise.all(toFetch.map(({ userId }) => fetchUserById(userId)));
  const members = toFetch.map(({ rawId, userId }, i) => {
    const user = users[i];
    return {
      userId,
      nickname: user?.nickname ?? null,
      name: user?.name ?? userId,
      isOwner: userId === adventure.ownerId || rawId === adventure.ownerId,
    };
  });

  return NextResponse.json({ members });
}
