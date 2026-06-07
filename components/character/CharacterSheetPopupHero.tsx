"use client";

import type { ReactNode } from "react";
import type { CharacterIdentity } from "@/lib/character/types";
import { formatXpProgressDetail, xpProgressRatio, MAX_LEVEL } from "@/lib/character/xp";
import { getAscension, getSubclassTrack } from "@/lib/character/subclass-tracks";

type Props = {
  name: string;
  identity: CharacterIdentity;
  /** Botão compacto de subir de nível (junto ao XP). */
  levelUpSlot?: ReactNode;
};

/** Identidade no topo da ficha (nome, classe, nível). */
export function CharacterSheetPopupHero({ name, identity, levelUpSlot }: Props) {
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
        <p className="sheet-popup-identity__eyebrow">Personagem</p>
        <h2 className="sheet-popup-identity__name">{name}</h2>
        {classLine ? <p className="sheet-popup-identity__class">{classLine}</p> : null}
        <p className="sheet-popup-identity__meta">
          {[identity.raca, identity.antecedente].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="sheet-popup-identity__level" aria-label={`Nível ${nivel}`}>
        <div className="sheet-popup-identity__hex">
          <svg viewBox="0 0 52 52" fill="none" aria-hidden>
            <polygon
              points="26,2 50,14 50,38 26,50 2,38 2,14"
              fill="#100c06"
              stroke="#c89030"
              strokeWidth="2.5"
            />
            <polygon
              points="26,7 45,18 45,34 26,45 7,34 7,18"
              fill="none"
              stroke="#5a3a0e"
              strokeWidth="1"
            />
          </svg>
          <span className="sheet-popup-identity__hex-num">{nivel}</span>
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
          {levelUpSlot ? <div className="sheet-popup-identity__levelup">{levelUpSlot}</div> : null}
        </div>
      </div>
    </div>
  );
}
