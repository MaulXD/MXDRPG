import { NextResponse } from "next/server";
import { isAdventureBoundCharacter } from "@/lib/character/adventure-bind";
import { resolveCharacter } from "@/lib/character/characters";
import { newInstanceId } from "@/lib/character/inventory-storage";
import {
  createInventoryItemRequest,
  listPendingInventoryRequestsForCharacter,
} from "@/lib/character/inventory-item-request-store";
import { getAdventure } from "@/lib/adventure/store";
import { canManageAdventure } from "@/lib/auth/adventure-access";
import { getSession } from "@/lib/auth/session";
import type { CompendiumPackId } from "@/lib/compendium/types";
import { getEntry } from "@/lib/compendium/registry";

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
  if (character.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const requests = await listPendingInventoryRequestsForCharacter(id);
  return NextResponse.json({ requests });
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const character = await resolveCharacter(id);
  if (!character) {
    return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
  }
  if (character.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Só o dono pode solicitar itens" }, { status: 403 });
  }
  if (!isAdventureBoundCharacter(character)) {
    return NextResponse.json(
      { error: "Fichas fora de campanha podem editar o inventário diretamente" },
      { status: 400 }
    );
  }

  const body = (await request.json()) as {
    packId?: string;
    entryId?: string;
    quantity?: number;
    adventureId?: string;
    roomId?: string;
  };

  const packId = body.packId?.trim() as CompendiumPackId | undefined;
  const entryId = body.entryId?.trim();
  if (!packId || !entryId) {
    return NextResponse.json({ error: "Item inválido" }, { status: 400 });
  }

  const entry = getEntry(packId, entryId);
  if (!entry) {
    return NextResponse.json({ error: "Item não encontrado no compêndio" }, { status: 400 });
  }

  const adventureId =
    body.adventureId?.trim() ||
    character.adventureId?.trim() ||
    character.campaignRoomId?.trim() ||
    null;
  if (!adventureId) {
    return NextResponse.json({ error: "Aventura não identificada" }, { status: 400 });
  }

  const adventure = await getAdventure(adventureId);
  if (!adventure) {
    return NextResponse.json({ error: "Aventura não encontrada" }, { status: 404 });
  }
  if (canManageAdventure(adventure, session.user)) {
    return NextResponse.json(
      { error: "O mestre pode adicionar itens diretamente na ficha" },
      { status: 400 }
    );
  }

  const quantity = Math.max(1, Math.floor(body.quantity ?? 1));
  const existing = character.inventory.find(
    (i) => i.packId === packId && i.entryId === entryId
  );

  const created = await createInventoryItemRequest({
    characterId: id,
    adventureId,
    roomId: body.roomId?.trim() || null,
    requesterUserId: session.user.id,
    packId,
    entryId,
    quantity,
    mergeExisting: Boolean(existing),
    instanceId: existing?.instanceId ?? newInstanceId(),
    itemLabel: entry.name,
  });

  return NextResponse.json({ request: created });
}
