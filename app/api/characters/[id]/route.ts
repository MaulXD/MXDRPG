import { NextResponse } from "next/server";
import { canEditCharacter, resolveCharacter, saveCharacter } from "@/lib/character/characters";
import { isPortraitOnlyPatch } from "@/lib/auth/portrait-access";
import { canEditCharacterPortrait } from "@/lib/auth/portrait-access-server";
import { getSession } from "@/lib/auth/session";
import type { CharacterSheet } from "@/lib/character/types";
import { applyIdentityPatch } from "@/lib/character/identity";
import { normalizeReligionId } from "@/lib/character/pantheon";
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
      | "combatLoadout"
      | "armorLoadout"
    >
  > & { religiao?: string };

  const canEdit = canEditCharacter(existing, session.user.id, session.user.role);
  const canPortrait =
    isPortraitOnlyPatch(patch as Record<string, unknown>) &&
    (await canEditCharacterPortrait(existing, session.user));
  if (!canEdit && !canPortrait) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const safe = sanitizeActorPatch(patch);
  let merged = normalizeCharacter({
    ...existing,
    ...safe,
    name: patch.name !== undefined ? String(patch.name).trim().slice(0, 80) : existing.name,
    biography:
      patch.biography !== undefined ? String(patch.biography).slice(0, 2000) : existing.biography,
  });

  if (patch.religiao !== undefined) {
    merged = applyIdentityPatch(merged, { religiao: normalizeReligionId(patch.religiao) });
  }

  const saved = await saveCharacter(merged);
  return NextResponse.json({ ok: true, character: saved });
}
