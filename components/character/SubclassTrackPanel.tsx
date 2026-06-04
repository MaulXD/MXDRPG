"use client";

import type { CharacterSheet } from "@/lib/character/types";
import { getSubclassTrack, parseCharacterTalents } from "@/lib/character/subclass-tracks";
import { TalentTreeGraph } from "@/components/character/TalentTreeGraph";
import "./level-up.css";

type Props = {
  actor: CharacterSheet;
};

export function SubclassTrackPanel({ actor }: Props) {
  const track = getSubclassTrack(actor.identity.subclasse);
  if (!track) {
    if (!actor.identity.subclasse) {
      return (
        <p className="sheet-track-empty">
          Escolha subclasse no nv 2 (level up) para ver a árvore de talentos.
        </p>
      );
    }
    return <p className="sheet-track-empty">Trilha não encontrada para esta subclasse.</p>;
  }

  const owned = parseCharacterTalents(actor.identity.talentos);

  return (
    <div className="sheet-track">
      <TalentTreeGraph
        track={track}
        owned={owned}
        actorLevel={actor.identity.nivel}
        compact
      />
    </div>
  );
}
