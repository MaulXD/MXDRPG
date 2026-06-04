import { NextResponse } from "next/server";
import {
  createCharacterFromWizard,
  listCharactersForUser,
  MAX_CHARACTERS_PER_USER,
} from "@/lib/character/characters";
import type { CharacterWizardDraft } from "@/lib/character/wizard-types";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  const characters = await listCharactersForUser(session.user.id);
  return NextResponse.json({
    characters: characters.map((c) => ({
      id: c.id,
      name: c.name,
      nivel: c.identity.nivel,
      classe: c.identity.classe,
      raca: c.identity.raca,
      portraitUrl: c.portraitUrl ?? null,
    })),
    limit: MAX_CHARACTERS_PER_USER,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const body = (await request.json()) as CharacterWizardDraft;
  try {
    const sheet = await createCharacterFromWizard(session.user.id, body);
    return NextResponse.json({ ok: true, character: { id: sheet.id, name: sheet.name } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao criar ficha" },
      { status: 400 }
    );
  }
}
