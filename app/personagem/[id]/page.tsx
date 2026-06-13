import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { CharacterSheet } from "@/components/character/CharacterSheet";
import { canEditCharacterWithGrant, resolveCharacter } from "@/lib/character/characters";
import { isAdventureBoundCharacter } from "@/lib/character/adventure-bind";
import { canEditCharacterPortrait } from "@/lib/auth/portrait-access-server";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { getPackEntries } from "@/lib/compendium/registry";
import type { CompendiumPackId } from "@/lib/compendium/types";
import { pageMetadata } from "@/lib/site-metadata";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const character = await resolveCharacter(id);
  return pageMetadata(character?.name?.trim() || "Ficha");
}

const PLAYER_PACKS: CompendiumPackId[] = [
  "armas",
  "habilidades",
  "magias",
  "equipamentos",
  "consumiveis",
];

export default async function PersonagemPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(signInPath(`/personagem/${id}`));

  const character = await resolveCharacter(id);
  if (!character) notFound();

  const canEdit = canEditCharacterWithGrant(character, session.user.id, session.user.role);
  const canEditPortrait = canEdit || (await canEditCharacterPortrait(character, session.user));
  const isOwner = character.ownerId === session.user.id;
  const showEditRequest = isOwner && isAdventureBoundCharacter(character) && !canEdit;

  const compendium = Object.fromEntries(
    PLAYER_PACKS.map((p) => [p, getPackEntries(p, { role: session.user.role })])
  ) as Record<CompendiumPackId, ReturnType<typeof getPackEntries>>;

  return (
    <div className="page-wrap page-wrap--sheet-ddb">
      <CharacterSheet
        character={character}
        canEdit={canEdit}
        canEditPortrait={canEditPortrait}
        compendium={compendium}
        roomId={character.adventureId ?? character.campaignRoomId ?? "demo"}
        variant="popup"
        standalonePage
        showEditRequest={showEditRequest}
      />
    </div>
  );
}
