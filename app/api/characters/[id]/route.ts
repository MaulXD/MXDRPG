import { NextResponse } from "next/server";
import { canEditCharacter, resolveCharacter, saveCharacter } from "@/lib/character/characters";
import { getSession } from "@/lib/auth/session";
import type { CharacterSheet } from "@/lib/character/types";
import { normalizeCharacter } from "@/lib/character/normalize";
import { sanitizeActorPatch } from "@/lib/room/internal/actor-patch";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const character = await resolveCharacter(id);
  if (!character) {
    return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
  }
  if (!canEditCharacter(character, session.user.id, session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  return NextResponse.json({ character });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const existing = await resolveCharacter(id);
  if (!existing) {
    return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
  }
  if (!canEditCharacter(existing, session.user.id, session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const patch = (await request.json()) as Partial<
    Pick<
      CharacterSheet,
      | "name"
      | "biography"
      | "portraitUrl"
      | "tokenImageUrl"
      | "portraitFocus"
      | "coverFocus"
      | "tokenFocus"
      | "inventory"
    >
  >;

  const safe = sanitizeActorPatch(patch);
  const merged = normalizeCharacter({
    ...existing,
    ...safe,
    name: patch.name !== undefined ? String(patch.name).trim().slice(0, 80) : existing.name,
    biography:
      patch.biography !== undefined ? String(patch.biography).slice(0, 2000) : existing.biography,
  });

  const saved = await saveCharacter(merged);
  return NextResponse.json({ ok: true, character: saved });
}
