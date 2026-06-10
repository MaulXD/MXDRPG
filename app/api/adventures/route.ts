import { NextResponse } from "next/server";
import { createAdventure, listAdventuresForUser } from "@/lib/adventure/store";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  const adventures = await listAdventuresForUser(session.user.id);
  return NextResponse.json({ adventures });
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
    const result = await createAdventure(session.user.id, name, { accessMode });
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
