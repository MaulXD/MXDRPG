import { NextResponse } from "next/server";
import { enrichAdventureListItems } from "@/lib/adventure/list-enrich";
import { createAdventure, listAdventuresForUser } from "@/lib/adventure/store";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_RPG_SYSTEM_ID, normalizeRpgSystemId } from "@/lib/rpg/systems";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Faça login" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const rpgSystemParam = searchParams.get("rpgSystem");
    const rpgSystemId = rpgSystemParam ? normalizeRpgSystemId(rpgSystemParam) : undefined;
    const adventures = await enrichAdventureListItems(
      await listAdventuresForUser(session.user.id, { rpgSystemId })
    );
    return NextResponse.json({ adventures });
  } catch (e) {
    console.error("[api/adventures GET]", e);
    return NextResponse.json({ adventures: [], degraded: true });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Faça login" }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Nome da aventura obrigatório" }, { status: 400 });
    }

    const accessMode = body.accessMode === "closed" ? "closed" : "public";
    const rpgSystemId = normalizeRpgSystemId(body.rpgSystem ?? DEFAULT_RPG_SYSTEM_ID);
    const result = await createAdventure(session.user.id, name, { accessMode, rpgSystemId });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const { adventure } = result;
    return NextResponse.json({
      adventure: {
        adventureId: adventure.adventureId,
        name: adventure.name,
        inviteCode: adventure.inviteCode,
        primaryRoomId: adventure.primaryRoomId,
        accessMode: adventure.accessMode,
        rpgSystemId: adventure.rpgSystemId,
        isOwner: true,
      },
    });
  } catch (e) {
    console.error("[api/adventures POST]", e);
    return NextResponse.json(
      { error: "Erro interno ao criar mesa. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
