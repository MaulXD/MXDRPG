"use client";

import { PA_ACCUMULATION_CAP_DEFAULT } from "@/lib/combat/pa-economy";
import { tokenSpendablePa } from "@/lib/combat/pa-turn";
import { normalizeTokenPaFields } from "@/lib/combat/pa-token-state";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  token: BattleToken;
  accumulationCap?: number;
  variant?: "default" | "hud";
};

export function PaHudMeter({
  token,
  accumulationCap = PA_ACCUMULATION_CAP_DEFAULT,
  variant = "default",
}: Props) {
  const recovery = Math.max(0, token.paMax ?? 0);
  const normalized = normalizeTokenPaFields(token, recovery, accumulationCap);
  const spendable = tokenSpendablePa({
    pa: normalized.pa,
    paMax: recovery,
    bankedPa: normalized.bankedPa,
  } as BattleToken);
  const dotTotal = Math.max(accumulationCap, spendable);
  const filled = Math.min(dotTotal, spendable);

  if (variant === "hud") {
    return (
      <div
        className="pa-hud-meter pa-hud-meter--hud"
        aria-label={`${spendable} de ${accumulationCap} pontos de ação`}
      >
        <span className="pa-hud-meter__label pa-hud-meter__label--hud">Pontos de Ação</span>
        <div className="pa-hud-meter__dots pa-hud-meter__dots--hud" aria-hidden>
          {Array.from({ length: dotTotal }, (_, i) => (
            <span
              key={i}
              className={`pa-hud-meter__dot pa-hud-meter__dot--hud${i < filled ? " pa-hud-meter__dot--on" : ""}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pa-hud-meter" aria-label={`${spendable} de ${accumulationCap} pontos de ação`}>
      <span className="pa-hud-meter__label">PA</span>
      <span className="pa-hud-meter__count">
        {spendable}/{accumulationCap}
      </span>
      <div className="pa-hud-meter__dots" aria-hidden>
        {Array.from({ length: dotTotal }, (_, i) => (
          <span
            key={i}
            className={`pa-hud-meter__dot${i < filled ? " pa-hud-meter__dot--on" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
