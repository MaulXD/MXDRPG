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
    const hudDots = PA_ACCUMULATION_CAP_DEFAULT;
    const hudFilled = Math.min(hudDots, spendable);
    return (
      <div className="hud-pa" aria-label={`${spendable} de ${hudDots} pontos de ação`}>
        <span className="hud-pa-label">PA</span>
        <div className="hud-pa-dots" aria-hidden>
          {Array.from({ length: hudDots }, (_, i) => (
            <div
              key={i}
              className={`hud-pa-dot${i < hudFilled ? " hud-pa-dot--on" : ""}`}
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
