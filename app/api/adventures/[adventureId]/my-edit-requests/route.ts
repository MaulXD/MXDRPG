import { NextResponse } from "next/server";
import { listActiveSheetEditRequestsForUser } from "@/lib/character/sheet-edit-request-store";
import { resolveCharacter } from "@/lib/character/characters";
import { getAdventure } from "@/lib/adventure/store";
import { getSession } from "@/lib/auth/session";

type Params = { params: Promise<{ adventureId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { adventureId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const adventure = await getAdventure(adventureId);
  if (!adventure) {
    return NextResponse.json({ error: "Aventura não encontrada" }, { status: 404 });
  }

  const requests = await listActiveSheetEditRequestsForUser(adventureId, session.user.id);
  const enriched = await Promise.all(
    requests.map(async (r) => {
      const character = await resolveCharacter(r.characterId);
      return { ...r, characterName: character?.name ?? "Personagem" };
    })
  );

  return NextResponse.json({ requests: enriched });
}
