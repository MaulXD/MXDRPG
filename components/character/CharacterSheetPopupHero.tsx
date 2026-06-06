"use client";

import type { CharacterIdentity } from "@/lib/character/types";
import { formatXpProgress, xpProgressRatio } from "@/lib/character/xp";

type Props = {
  name: string;
  identity: CharacterIdentity;
};

/** Identidade no topo da ficha (nome, classe, nível). */
export function CharacterSheetPopupHero({ name, identity }: Props) {
  const nivel = identity.nivel;
  const xpTotal = identity.xpTotal ?? 0;
  const xpPct = Math.round(xpProgressRatio(nivel, xpTotal) * 100);
  const classLine = [identity.classe, identity.subclasse].filter(Boolean).join(" · ");

  return (
    <div className="sheet-popup-identity">
      <div className="sheet-popup-identity__main">
        <p className="sheet-popup-identity__eyebrow">Ficha de personagem</p>
        <h2 className="sheet-popup-identity__name">{name}</h2>
        {classLine ? <p className="sheet-popup-identity__class">{classLine}</p> : null}
        <p className="sheet-popup-identity__meta">
          {[identity.raca, identity.antecedente].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="sheet-popup-identity__level" aria-label={`Nível ${nivel}`}>
        <div className="sheet-popup-identity__ring">
          <span>{nivel}</span>
        </div>
        <div className="sheet-popup-identity__xp">
          <div
            className="sheet-popup-identity__xp-track"
            role="progressbar"
            aria-valuenow={xpPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${xpPct}%` }} />
          </div>
          <span className="sheet-popup-identity__xp-text">{formatXpProgress(nivel, xpTotal)}</span>
        </div>
      </div>
    </div>
  );
}
