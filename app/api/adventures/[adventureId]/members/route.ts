import { NextResponse } from "next/server";
import { getAdventure } from "@/lib/adventure/store";
import { isAdventureMember } from "@/lib/auth/adventure-access";
import { getSession } from "@/lib/auth/session";
import { fetchClerkIdForUser, fetchUserById } from "@/lib/db/users";

type Params = { params: Promise<{ adventureId: string }> };

export async function GET(_req: Request, { params }: Params) {
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

  const ids = [...new Set([adventure.ownerId, ...adventure.memberIds])];
  const members = await Promise.all(
    ids.map(async (userId) => {
      const user = await fetchUserById(userId);
      return {
        userId,
        nickname: user?.nickname ?? null,
        name: user?.name ?? userId,
        isOwner: userId === adventure.ownerId,
      };
    })
  );

  return NextResponse.json({ members });
}
