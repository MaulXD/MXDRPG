"use client";

import { PA_ACCUMULATION_CAP_DEFAULT } from "@/lib/combat/pa-economy";
import { resolvePaHudDisplay } from "@/lib/combat/pa-display";
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
  const { spendable, dotCapacity, filledDots } = resolvePaHudDisplay(token, accumulationCap);

  if (variant === "hud") {
    return (
      <div className="hud-pa" aria-label={`${spendable} pontos de ação`}>
        <span className="hud-pa-label">PA</span>
        <span className="hud-pa-value">{spendable}</span>
        <div className="hud-pa-dots" aria-hidden>
          {Array.from({ length: dotCapacity }, (_, i) => (
            <div
              key={i}
              className={`hud-pa-dot${i < filledDots ? " hud-pa-dot--on" : ""}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pa-hud-meter" aria-label={`${spendable} de ${dotCapacity} pontos de ação`}>
      <span className="pa-hud-meter__label">PA</span>
      <span className="pa-hud-meter__count">
        {spendable}/{dotCapacity}
      </span>
      <div className="pa-hud-meter__dots" aria-hidden>
        {Array.from({ length: dotCapacity }, (_, i) => (
          <span
            key={i}
            className={`pa-hud-meter__dot${i < filledDots ? " pa-hud-meter__dot--on" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
