"use client";

import type { CharacterSheet } from "@/lib/character/types";
import { getSubclassTrack, parseCharacterTalents } from "@/lib/character/subclass-tracks";
import { buildTalentTreeNodes } from "@/lib/character/level-up-ui";
import { TalentTreeGraph } from "@/components/character/TalentTreeGraph";
import "./level-up.css";

type Props = {
  actor: CharacterSheet;
  /** Lista compacta no pop-up da mesa (sem árvore larga). */
  popup?: boolean;
};

export function SubclassTrackPanel({ actor, popup }: Props) {
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

  if (popup) {
    const nodes = buildTalentTreeNodes(track, owned, actor.identity.nivel);
    const talents = nodes.filter((n) => n.kind === "talent");
    return (
      <div className="sheet-popup-card">
        <p className="sheet-popup-card__title">{track.subclass}</p>
        <p className="sheet-popup-card__sub">{track.specialty}</p>
        <ul className="sheet-popup-talent-list">
          {talents.map((node) => (
            <li
              key={node.key}
              className={`sheet-popup-talent-item sheet-popup-talent-item--${node.state}`}
            >
              <span className="sheet-popup-talent-lv">Nv {node.level}</span>
              <span className="sheet-popup-talent-name">{node.label}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

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
