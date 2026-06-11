import { NextResponse } from "next/server";
import {
  approveAllPendingInventoryRequestsForAdventure,
  listPendingInventoryRequestsForAdventure,
} from "@/lib/character/inventory-item-request-store";
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
  let requests = await listPendingInventoryRequestsForAdventure(adventureId);
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

export async function PATCH(request: Request, { params }: Params) {
  const { adventureId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const adventure = await getAdventure(adventureId);
  if (!adventure || !canManageAdventure(adventure, session.user)) {
    return NextResponse.json({ error: "Somente o mestre pode aprovar solicitações" }, { status: 403 });
  }

  const body = (await request.json()) as { action?: string };
  if (body.action !== "approve_all") {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  const result = await approveAllPendingInventoryRequestsForAdventure(
    adventureId,
    session.user.id
  );

  return NextResponse.json(result);
}
