import { NextResponse } from "next/server";
import {
  actorForRoomAuth,
  canEditRoomActor,
  canPatchRoomActorLoadout,
  ownerInventoryAdditionBlocked,
} from "@/lib/auth/room-access";
import { canEditRoomActorPortrait, isPortraitOnlyPatch } from "@/lib/auth/portrait-access";
import { getSession } from "@/lib/auth/session";
import { resolveCharacter } from "@/lib/character/characters";
import {
  isLoadoutOnlyPatch,
  mergeIdentityPatch,
  sanitizeActorPatch,
} from "@/lib/room/internal/actor-patch";
import { normalizeCharacter } from "@/lib/character/normalize";
import { classResourceKeysFor } from "@/lib/character/class-resource-keys";
import type { CharacterSheet } from "@/lib/character/types";
import type { IdentityPatch } from "@/lib/character/identity";
import { getRoom, getRoomActor, updateRoomActor } from "@/lib/room/store";

type Params = { params: Promise<{ roomId: string; actorId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { roomId, actorId } = await params;
  const actor = await getRoomActor(roomId, actorId);
  if (!actor) {
    return NextResponse.json({ error: "Personagem não encontrado na sala" }, { status: 404 });
  }
  return NextResponse.json(actor);
}

export async function PATCH(req: Request, { params }: Params) {
  const { roomId, actorId } = await params;
  const session = await getSession();
  const room = await getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const seed = await resolveCharacter(actorId);
  if (!seed) {
    return NextResponse.json({ error: "Personagem inválido" }, { status: 404 });
  }

  const live = await getRoomActor(roomId, actorId, { room });
  const actorForAuth = actorForRoomAuth(room, { ...seed, ...live });

  const body = (await req.json()) as Record<string, unknown>;
  const user = session?.user ?? null;
  const canEdit = canEditRoomActor(room, actorForAuth, user);
  const canLoadout =
    isLoadoutOnlyPatch(body) && canPatchRoomActorLoadout(room, actorForAuth, user);
  const canPortrait =
    isPortraitOnlyPatch(body) && canEditRoomActorPortrait(room, actorForAuth, user);
  if (!canEdit && !canPortrait && !canLoadout) {
    return NextResponse.json({ error: "Sem permissão para editar esta ficha" }, { status: 403 });
  }
  // BV-045b: compara a ficha resultante (patch aplicado e normalizado, como updateRoomActor)
  // com a atual. Roda sempre: loadout, armadura e identityPatch criam itens em normalizeCharacter.
  const current = { ...seed, ...live } as CharacterSheet;
  const safe = await sanitizeActorPatch(body as Parameters<typeof sanitizeActorPatch>[0]);
  const withIdentity = body.identityPatch
    ? mergeIdentityPatch({ ...current, ...safe } as CharacterSheet, body.identityPatch as IdentityPatch)
    : ({ ...current, ...safe } as CharacterSheet);
  if (
    ownerInventoryAdditionBlocked(
      room,
      actorForAuth,
      user,
      normalizeCharacter(current).inventory,
      normalizeCharacter(withIdentity).inventory,
      classResourceKeysFor(withIdentity)
    )
  ) {
    return NextResponse.json({ error: "Peça o item ao mestre da aventura." }, { status: 403 });
  }
  const snapshot = await updateRoomActor(roomId, actorId, body, { room });
  if (!snapshot) {
    return NextResponse.json({ error: "Sala ou personagem não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    actor: snapshot.actors[actorId],
    scene: snapshot.scene,
    revision: snapshot.revision,
    sheetSaved: snapshot.sheetSaved,
  });
}
