import { NextResponse } from "next/server";
import { createTorCharacterFromWizard, listTorCharactersForAdventure } from "@/lib/character/um-anel/characters";
import type { TorCharacterWizardDraft } from "@/lib/character/um-anel/wizard-types";
import { materializeSessionUser } from "@/lib/auth/session-user";
import { getSession } from "@/lib/auth/session";
import { getAdventure } from "@/lib/adventure/store";
import { isAdventureMember } from "@/lib/auth/adventure-access";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  const adventureId = new URL(request.url).searchParams.get("adventureId")?.trim();
  if (!adventureId) {
    return NextResponse.json({ error: "adventureId obrigatório" }, { status: 400 });
  }

  const user = await materializeSessionUser(session.user);
  const adventure = await getAdventure(adventureId);
  if (!adventure) return NextResponse.json({ error: "Aventura não encontrada" }, { status: 404 });
  if (!isAdventureMember(adventure, user.id, user.clerkId ?? session.user.clerkId)) {
    return NextResponse.json({ error: "Você não faz parte dessa aventura" }, { status: 403 });
  }

  const characters = await listTorCharactersForAdventure(adventureId);
  return NextResponse.json({ characters });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const body = (await request.json()) as TorCharacterWizardDraft & { adventureId?: string };
  try {
    const user = await materializeSessionUser(session.user);
    const { sheet } = await createTorCharacterFromWizard(user.id, body, {
      adventureId: body.adventureId ?? null,
      clerkId: user.clerkId ?? session.user.clerkId,
    });
    return NextResponse.json({
      ok: true,
      character: { id: sheet.id, name: sheet.name },
      adventureId: sheet.adventureId ?? body.adventureId ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao criar ficha" },
      { status: 400 }
    );
  }
}
