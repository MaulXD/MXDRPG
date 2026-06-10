import { NextResponse } from "next/server";
import { resolveCharacter } from "@/lib/character/characters";
import {
  dismissRejectedSheetEditRequest,
  getSheetEditRequest,
  resolveSheetEditRequestByGm,
} from "@/lib/character/sheet-edit-request-store";
import { getAdventure } from "@/lib/adventure/store";
import { canManageAdventure } from "@/lib/auth/adventure-access";
import { getSession } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string; requestId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id, requestId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const editRequest = await getSheetEditRequest(requestId);
  if (!editRequest || editRequest.characterId !== id) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }
  const body = (await request.json()) as { action?: string };

  if (body.action === "dismiss") {
    if (editRequest.requesterUserId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const ok = await dismissRejectedSheetEditRequest(requestId, session.user.id);
    if (!ok) {
      return NextResponse.json({ error: "Não foi possível dispensar" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (editRequest.status !== "pending") {
    return NextResponse.json({ error: "Solicitação já resolvida" }, { status: 400 });
  }

  const adventure = await getAdventure(editRequest.adventureId);
  if (!adventure || !canManageAdventure(adventure, session.user)) {
    return NextResponse.json({ error: "Somente o mestre pode aprovar ou recusar" }, { status: 403 });
  }

  const character = await resolveCharacter(id);
  if (!character) {
    return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
  }

  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  const updated = await resolveSheetEditRequestByGm(requestId, body.action, session.user.id);
  if (!updated) {
    return NextResponse.json({ error: "Falha ao atualizar solicitação" }, { status: 500 });
  }

  return NextResponse.json({ request: updated, characterName: character.name });
}
