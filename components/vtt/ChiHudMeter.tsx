"use client";

import {
  CHI_POOL_PER_COMBAT,
  CHI_SPEND_CAP_PER_TURN,
  chiAvailable,
  chiSpentThisTurn,
} from "@/lib/combat/chi-economy";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  token: BattleToken;
};

export function ChiHudMeter({ token }: Props) {
  const available = chiAvailable(token);
  const max = token.chiMax ?? CHI_POOL_PER_COMBAT;
  const spentTurn = chiSpentThisTurn(token);
  const capTurn = CHI_SPEND_CAP_PER_TURN;
  const canSpendMore = spentTurn < capTurn;

  return (
    <div
      className="hud-chi"
      aria-label={`Chi: ${available} de ${max} — ${capTurn - spentTurn} disponível este turno`}
    >
      <span className="hud-chi-label">χ</span>
      <span className={`hud-chi-value${!canSpendMore ? " hud-chi-value--spent" : ""}`}>
        {available}
      </span>
      <div className="hud-chi-turn" aria-hidden>
        {Array.from({ length: capTurn }, (_, i) => (
          <div
            key={i}
            className={`hud-chi-pip${i < spentTurn ? " hud-chi-pip--used" : ""}`}
          />
        ))}
      </div>
      <span className="hud-chi-max">/{max}</span>
    </div>
  );
}
