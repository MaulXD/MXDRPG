import { NextResponse } from "next/server";
import { saveCharacter, resolveCharacter } from "@/lib/character/characters";
import { grantFromRequest } from "@/lib/character/edit-access";
import {
  finalizeLastLevelReedit,
  mergeWizardIntoCharacterPreservingCampaign,
  prepareCharacterForLastLevelReedit,
} from "@/lib/character/rebuild-from-wizard";
import type { LevelUpChoices } from "@/lib/character/level-up";
import type { CharacterWizardDraft } from "@/lib/character/wizard-types";
import {
  consumeSheetEditGrant,
  getSheetEditRequest,
} from "@/lib/character/sheet-edit-request-store";
import { canEditCharacterWithGrant } from "@/lib/character/edit-access";
import { getSession } from "@/lib/auth/session";
import { syncAdventureActorsForRoom } from "@/lib/room/adventure-actors";
import { getAdventure } from "@/lib/adventure/store";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const existing = await resolveCharacter(id);
  if (!existing) {
    return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
  }

  const body = (await request.json()) as {
    requestId?: string;
    draft?: CharacterWizardDraft;
    levelUpChoices?: LevelUpChoices;
    preparedCharacter?: import("@/lib/character/types").CharacterSheet;
  };

  const requestId = body.requestId?.trim();
  if (!requestId) {
    return NextResponse.json({ error: "requestId obrigatório" }, { status: 400 });
  }

  const editRequest = await getSheetEditRequest(requestId);
  if (!editRequest || editRequest.characterId !== id) {
    return NextResponse.json({ error: "Solicitação inválida" }, { status: 404 });
  }
  if (editRequest.requesterUserId !== session.user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }
  if (editRequest.status !== "approved") {
    return NextResponse.json({ error: "Solicitação não está aprovada" }, { status: 400 });
  }

  const grant = grantFromRequest(editRequest);
  if (!canEditCharacterWithGrant(existing, session.user.id, session.user.role, { grant })) {
    return NextResponse.json({ error: "Sem permissão para editar" }, { status: 403 });
  }

  let saved;
  try {
    if (editRequest.scope === "full_rebuild") {
      if (!body.draft) {
        return NextResponse.json({ error: "draft obrigatório para reconstrução" }, { status: 400 });
      }
      saved = await saveCharacter(
        mergeWizardIntoCharacterPreservingCampaign(existing, body.draft, "full_rebuild")
      );
    } else {
      const prepared = body.preparedCharacter ?? prepareCharacterForLastLevelReedit(existing);
      saved = await saveCharacter(
        finalizeLastLevelReedit(prepared, body.levelUpChoices ?? {})
      );
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao salvar" },
      { status: 400 }
    );
  }

  await consumeSheetEditGrant(requestId);

  const adventureId = existing.adventureId ?? existing.campaignRoomId;
  if (adventureId) {
    const adv = await getAdventure(adventureId);
    if (adv?.primaryRoomId) {
      await syncAdventureActorsForRoom(adv.primaryRoomId);
    }
  }

  return NextResponse.json({ ok: true, character: saved });
}
