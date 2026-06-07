"use client";

import type { CharacterIdentity } from "@/lib/character/types";
import { formatXpProgressDetail, xpProgressRatio, MAX_LEVEL } from "@/lib/character/xp";
import { getAscension, getSubclassTrack } from "@/lib/character/subclass-tracks";

type Props = {
  name: string;
  identity: CharacterIdentity;
};

/** Identidade no topo da ficha (nome, classe, nível). */
export function CharacterSheetPopupHero({ name, identity }: Props) {
  const nivel = identity.nivel;
  const xpTotal = identity.xpTotal ?? 0;
  const xpPct = Math.round(xpProgressRatio(nivel, xpTotal) * 100);
  const xpDetail = formatXpProgressDetail(nivel, xpTotal);
  const track = getSubclassTrack(identity.subclasse ?? null);
  const ascension = track ? getAscension(track) : null;
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
          <p className="sheet-popup-identity__xp-primary">{xpDetail.primary}</p>
          <div
            className="sheet-popup-identity__xp-track"
            role="progressbar"
            aria-valuenow={nivel >= MAX_LEVEL ? 100 : xpPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={xpDetail.barLabel}
          >
            <span style={{ width: `${xpPct}%` }} />
          </div>
          <span className="sheet-popup-identity__xp-text">{xpDetail.secondary}</span>
          {nivel >= MAX_LEVEL && ascension ? (
            <span className="sheet-popup-identity__ascension" title={ascension.name}>
              Ascensão — {ascension.name}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
