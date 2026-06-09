import { NextResponse } from "next/server";
import { isAdventureBoundCharacter } from "@/lib/character/adventure-bind";
import { resolveCharacter } from "@/lib/character/characters";
import type { SheetEditScope } from "@/lib/character/sheet-edit-request";
import {
  createSheetEditRequest,
  getActiveSheetEditRequestForCharacter,
} from "@/lib/character/sheet-edit-request-store";
import { getAdventure } from "@/lib/adventure/store";
import { getSession } from "@/lib/auth/session";

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

  const request = await getActiveSheetEditRequestForCharacter(id, session.user.id);
  return NextResponse.json({ request });
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
    return NextResponse.json({ error: "Só o dono pode solicitar edição" }, { status: 403 });
  }
  if (!isAdventureBoundCharacter(character)) {
    return NextResponse.json(
      { error: "Fichas fora de campanha podem ser editadas diretamente" },
      { status: 400 }
    );
  }

  const body = (await request.json()) as {
    scope?: SheetEditScope;
    roomId?: string;
    adventureId?: string;
  };
  const scope = body.scope;
  if (scope !== "full_rebuild" && scope !== "last_level") {
    return NextResponse.json({ error: "Escopo inválido" }, { status: 400 });
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

  const existing = await getActiveSheetEditRequestForCharacter(id, session.user.id);
  if (existing?.status === "pending") {
    return NextResponse.json({ request: existing, alreadyPending: true });
  }
  if (existing?.status === "approved") {
    return NextResponse.json({ request: existing, alreadyApproved: true });
  }

  const created = await createSheetEditRequest({
    characterId: id,
    adventureId,
    roomId: body.roomId?.trim() || null,
    requesterUserId: session.user.id,
    scope,
  });

  return NextResponse.json({ request: created });
}
