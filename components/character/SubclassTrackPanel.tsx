"use client";

import type { CharacterSheet } from "@/lib/character/types";
import { getSubclassTrack, parseCharacterTalents } from "@/lib/character/subclass-tracks";
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

  const ownedTalents = owned.filter((t) => t.level <= actor.identity.nivel);

  if (popup) {
    return (
      <div className="sheet-popup-card">
        <p className="sheet-popup-card__title">{track.subclass}</p>
        <p className="sheet-popup-card__sub">{track.specialty}</p>
        {ownedTalents.length === 0 ? (
          <p className="sheet-track-empty">Nenhum talento desbloqueado ainda.</p>
        ) : (
          <ul className="sheet-popup-talent-list">
            {ownedTalents.map((t) => (
              <li key={t.id} className="sheet-popup-talent-item sheet-popup-talent-item--owned">
                <span className="sheet-popup-talent-lv">Nv {t.level}</span>
                <span className="sheet-popup-talent-name">{t.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="sheet-track">
      <p className="sheet-track__label">{track.subclass}</p>
      {ownedTalents.length === 0 ? (
        <p className="sheet-track-empty">Talentos aparecem aqui ao subir de nível.</p>
      ) : (
        <ul className="sheet-popup-talent-list">
          {ownedTalents.map((t) => (
            <li key={t.id} className="sheet-popup-talent-item sheet-popup-talent-item--owned">
              <span className="sheet-popup-talent-lv">Nv {t.level}</span>
              <span className="sheet-popup-talent-name">{t.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
