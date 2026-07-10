"use client";

import type { CharacterSheet } from "@/lib/character/types";
import { getFeat, FEAT_CATEGORY_LABELS } from "@/lib/character/feats";

type Props = {
  actor: CharacterSheet;
  popup?: boolean;
};

export function UniversalFeatsPanel({ actor, popup }: Props) {
  const ids = actor.identity.featIds ?? [];
  if (ids.length === 0) return null;

  const feats = ids.map((id) => getFeat(id)).filter(Boolean) as NonNullable<ReturnType<typeof getFeat>>[];

  if (popup) {
    return (
      <div className="sheet-popup-card">
        <p className="sheet-popup-card__title">Talentos Universais</p>
        <ul className="sheet-popup-talent-list">
          {feats.map((f) => (
            <li key={f.id} className="sheet-popup-talent-item sheet-popup-talent-item--owned">
              <span className="sheet-popup-talent-lv">
                {FEAT_CATEGORY_LABELS[f.category] ?? f.category}
              </span>
              <span className="sheet-popup-talent-name">{f.name}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="sheet-track">
      <p className="sheet-track__label">Talentos Universais</p>
      <ul className="sheet-popup-talent-list">
        {feats.map((f) => (
          <li key={f.id} className="sheet-popup-talent-item sheet-popup-talent-item--owned">
            <span className="sheet-popup-talent-lv">
              {FEAT_CATEGORY_LABELS[f.category] ?? f.category}
            </span>
            <span className="sheet-popup-talent-name">{f.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
