import { NextResponse } from "next/server";
import { deleteCharacterSheet } from "@/lib/character/lifecycle";
import {
  canEditCharacterWithGrant,
  grantFromRequest,
  resolveCharacter,
  saveCharacter,
} from "@/lib/character/characters";
import {
  consumeSheetEditGrant,
  getSheetEditRequest,
} from "@/lib/character/sheet-edit-request-store";
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
  const grantReq = await import("@/lib/character/sheet-edit-request-store").then((m) =>
    m.getApprovedGrantForCharacter(id, session.user.id)
  );
  const grant = grantFromRequest(grantReq);
  if (!canEditCharacterWithGrant(character, session.user.id, session.user.role, { grant })) {
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
      | "lootEconomy"
    >
  > & { religiao?: string };

  const requestId = new URL(request.url).searchParams.get("requestId")?.trim() || null;
  let grant = null;
  if (requestId) {
    const editRequest = await getSheetEditRequest(requestId);
    if (
      editRequest &&
      editRequest.characterId === id &&
      editRequest.requesterUserId === session.user.id &&
      editRequest.status === "approved"
    ) {
      grant = grantFromRequest(editRequest);
    }
  } else {
    const approved = await import("@/lib/character/sheet-edit-request-store").then((m) =>
      m.getApprovedGrantForCharacter(id, session.user.id)
    );
    grant = grantFromRequest(approved);
  }

  const canEdit = canEditCharacterWithGrant(existing, session.user.id, session.user.role, {
    grant,
  });
  const canPortrait =
    isPortraitOnlyPatch(patch as Record<string, unknown>) &&
    (await canEditCharacterPortrait(existing, session.user));
  if (!canEdit && !canPortrait) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const safe = await sanitizeActorPatch(patch);
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

  if (grant && requestId) {
    await consumeSheetEditGrant(requestId);
  }

  return NextResponse.json({ ok: true, character: saved });
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    confirmName?: string;
    roomId?: string;
  };

  const result = await deleteCharacterSheet(id, session.user, {
    confirmName: body.confirmName ?? "",
    roomId: body.roomId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({ ok: true, roomId: result.roomId });
}
