import { redirect, notFound } from "next/navigation";
import { CharacterSheet } from "@/components/character/CharacterSheet";
import { canEditCharacter, resolveCharacter } from "@/lib/character/characters";
import { getSession } from "@/lib/auth/session";
import { getPackEntries } from "@/lib/compendium/registry";
import type { CompendiumPackId } from "@/lib/compendium/types";

type Props = { params: Promise<{ id: string }> };

const PLAYER_PACKS: CompendiumPackId[] = ["armas", "habilidades", "magias", "equipamentos"];

export default async function PersonagemPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/entrar?redirect=/personagem/${id}`);

  const character = await resolveCharacter(id);
  if (!character) notFound();

  const canEdit = canEditCharacter(character, session.user.id, session.user.role);

  const compendium = Object.fromEntries(
    PLAYER_PACKS.map((p) => [p, getPackEntries(p, { role: session.user.role })])
  ) as Record<CompendiumPackId, ReturnType<typeof getPackEntries>>;

  return (
    <div className="page-wrap page-hero">
      <CharacterSheet
        character={character}
        canEdit={canEdit}
        compendium={compendium}
        roomId={character.adventureId ?? "demo"}
      />
    </div>
  );
}
