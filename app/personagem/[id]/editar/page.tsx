import { redirect, notFound } from "next/navigation";
import { CharacterCreationWizard } from "@/components/character/wizard/CharacterCreationWizard";
import { SheetEditLastLevelFlow } from "@/components/character/SheetEditLastLevelFlow";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import {
  canStructuralSheetEditWithGrant,
  grantFromRequest,
  resolveCharacter,
} from "@/lib/character/characters";
import { prepareCharacterForLastLevelReedit } from "@/lib/character/rebuild-from-wizard";
import { getSheetEditRequest } from "@/lib/character/sheet-edit-request-store";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/site-metadata";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ requestId?: string }>;
};

export const metadata = pageMetadata("Editar ficha");

export default async function PersonagemEditarPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { requestId: requestIdRaw } = await searchParams;
  const requestId = requestIdRaw?.trim();
  if (!requestId) redirect(`/personagem/${id}`);

  const session = await getSession();
  if (!session) redirect(signInPath(`/personagem/${id}/editar?requestId=${encodeURIComponent(requestId)}`));

  const character = await resolveCharacter(id);
  if (!character) notFound();
  if (character.ownerId !== session.user.id) notFound();

  const editRequest = await getSheetEditRequest(requestId);
  if (
    !editRequest ||
    editRequest.characterId !== id ||
    editRequest.requesterUserId !== session.user.id ||
    editRequest.status !== "approved"
  ) {
    redirect(`/personagem/${id}`);
  }

  const grant = grantFromRequest(editRequest);
  if (!canStructuralSheetEditWithGrant(character, session.user.id, session.user.role, { grant })) {
    redirect(`/personagem/${id}`);
  }

  const adventureId = character.adventureId ?? character.campaignRoomId ?? null;

  return (
    <div className="page-wrap page-hero">
      <MedievalFrame variant="gothic" page>
        {editRequest.scope === "full_rebuild" ? (
          <CharacterCreationWizard
            slotsLeft={1}
            adventureId={adventureId}
            editMode={{
              scope: "full_rebuild",
              existingCharacter: character,
              requestId,
            }}
          />
        ) : (
          <SheetEditLastLevelFlow
            preparedActor={prepareCharacterForLastLevelReedit(character)}
            originalCharacterId={id}
            requestId={requestId}
          />
        )}
      </MedievalFrame>
    </div>
  );
}
