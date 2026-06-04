"use client";

import { CharacterSheet } from "@/components/character/CharacterSheet";
import { getCharacter } from "@/lib/character/demo-characters";
import { canEditRoomActor } from "@/lib/auth/room-access";
import type { CompendiumEntry, CompendiumPackId } from "@/lib/compendium/types";
import type { SessionUser } from "@/lib/auth/types";
import type { RoomActor } from "@/lib/room/types";

type Props = {
  actorId: string;
  roomId: string;
  actors: Record<string, RoomActor>;
  session: SessionUser | null;
  compendium: Record<CompendiumPackId, CompendiumEntry[]>;
};

export function MesaSheetPanel({ actorId, roomId, actors, session, compendium }: Props) {
  const live = actors[actorId];
  const seed = live ?? getCharacter(actorId);
  if (!seed) {
    return <p className="inv-empty">Personagem não encontrado.</p>;
  }
  const canEdit = canEditRoomActor({ roomId }, seed, session);
  const inventory = live.inventory?.length ? live.inventory : seed.inventory;

  return (
    <div className="mesa-panel-scroll mesa-panel-scroll--rail mesa-sheet-embed">
      <CharacterSheet
        character={{ ...seed, ...live, inventory }}
        canEdit={canEdit}
        compendium={compendium}
        roomId={roomId}
        embedded
      />
    </div>
  );
}
