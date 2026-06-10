import { NextResponse } from "next/server";
import { listPendingSheetEditRequests } from "@/lib/character/sheet-edit-request-store";
import { resolveCharacter } from "@/lib/character/characters";
import { getAdventure } from "@/lib/adventure/store";
import { canManageAdventure } from "@/lib/auth/adventure-access";
import { getSession } from "@/lib/auth/session";

type Params = { params: Promise<{ adventureId: string }> };

export async function GET(req: Request, { params }: Params) {
  const { adventureId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const adventure = await getAdventure(adventureId);
  if (!adventure || !canManageAdventure(adventure, session.user)) {
    return NextResponse.json({ error: "Somente o mestre pode ver solicitações" }, { status: 403 });
  }

  const roomId = new URL(req.url).searchParams.get("roomId")?.trim() || null;
  let requests = await listPendingSheetEditRequests(adventureId);
  if (roomId) {
    requests = requests.filter((r) => !r.roomId || r.roomId === roomId);
  }

  const enriched = await Promise.all(
    requests.map(async (r) => {
      const character = await resolveCharacter(r.characterId);
      return {
        ...r,
        characterName: character?.name ?? "Personagem",
      };
    })
  );

  return NextResponse.json({ requests: enriched });
}
