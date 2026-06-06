"use client";

import {
  portraitFocusToImgStyle,
  sanitizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
import type { CharacterIdentity } from "@/lib/character/types";
import { formatXpProgress, xpProgressRatio } from "@/lib/character/xp";

type Props = {
  name: string;
  identity: CharacterIdentity;
  portraitUrl?: string | null;
  portraitFocus?: PortraitFocus | null;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

/** Cabeçalho estilo VTT (arte + nome + anel de nível). */
export function CharacterSheetPopupHero({
  name,
  identity,
  portraitUrl,
  portraitFocus,
}: Props) {
  const focus = sanitizePortraitFocus(portraitFocus);
  const nivel = identity.nivel;
  const xpTotal = identity.xpTotal ?? 0;
  const xpPct = Math.round(xpProgressRatio(nivel, xpTotal) * 100);
  const classLine = [identity.classe, identity.subclasse].filter(Boolean).join(" · ").toUpperCase();

  return (
    <header className="sheet-popup-hero">
      <div className="sheet-popup-hero__bg" aria-hidden>
        {portraitUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portraitUrl}
            alt=""
            className="sheet-popup-hero__bg-img"
            style={focus ? portraitFocusToImgStyle(focus) : undefined}
          />
        ) : (
          <div className="sheet-popup-hero__bg-fallback">
            <span>{initials(name)}</span>
          </div>
        )}
        <div className="sheet-popup-hero__bg-shade" />
      </div>

      <div className="sheet-popup-hero__main">
        <p className="sheet-popup-hero__eyebrow">Ficha de personagem</p>
        <h2 className="sheet-popup-hero__name">{name}</h2>
        <p className="sheet-popup-hero__class">{classLine}</p>
        <p className="sheet-popup-hero__meta">
          {[identity.raca, identity.antecedente].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="sheet-popup-hero__level" aria-label={`Nível ${nivel}`}>
        <div className="sheet-popup-hero__ring">
          <span>{nivel}</span>
        </div>
        <div className="sheet-popup-hero__xp">
          <div
            className="sheet-popup-hero__xp-track"
            role="progressbar"
            aria-valuenow={xpPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${xpPct}%` }} />
          </div>
          <span className="sheet-popup-hero__xp-text">{formatXpProgress(nivel, xpTotal)}</span>
        </div>
      </div>
    </header>
  );
}
