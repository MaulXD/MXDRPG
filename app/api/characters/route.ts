import { NextResponse } from "next/server";
import {
  createCharacterFromWizard,
  listCharactersForUser,
  listCharactersForUserInAdventure,
  MAX_CHARACTERS_PER_USER,
  MAX_CHARACTERS_PER_USER_PER_ADVENTURE,
} from "@/lib/character/characters";
import type { CharacterWizardDraft } from "@/lib/character/wizard-types";
import { getSession } from "@/lib/auth/session";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  const adventureId =
    new URL(req.url).searchParams.get("adventureId")?.trim() ||
    new URL(req.url).searchParams.get("roomId")?.trim() ||
    null;
  const characters = adventureId
    ? await listCharactersForUserInAdventure(session.user.id, adventureId)
    : await listCharactersForUser(session.user.id);
  return NextResponse.json({
    characters: characters.map((c) => ({
      id: c.id,
      name: c.name,
      nivel: c.identity.nivel,
      classe: c.identity.classe,
      raca: c.identity.raca,
      portraitUrl: c.portraitUrl ?? null,
      adventureId: c.adventureId ?? null,
    })),
    limit: MAX_CHARACTERS_PER_USER,
    limitPerAdventure: MAX_CHARACTERS_PER_USER_PER_ADVENTURE,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const body = (await request.json()) as CharacterWizardDraft & {
    adventureId?: string;
    roomId?: string;
  };
  try {
    const sheet = await createCharacterFromWizard(session.user.id, body, {
      adventureId: body.adventureId ?? body.roomId ?? null,
    });
    return NextResponse.json({ ok: true, character: { id: sheet.id, name: sheet.name } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao criar ficha" },
      { status: 400 }
    );
  }
}
