"use client";

import { PA_ACCUMULATION_CAP_DEFAULT } from "@/lib/combat/pa-economy";
import { tokenSpendablePa } from "@/lib/combat/pa-turn";
import { normalizeTokenPaFields } from "@/lib/combat/pa-token-state";

type Props = {
  current: number;
  max: number;
  banked?: number;
  spentThisTurn?: number;
  accumulationCap?: number;
  showLabel?: boolean;
  size?: "sm" | "md";
  compact?: boolean;
};

function DotRow({
  total,
  filled,
  size,
}: {
  total: number;
  filled: number;
  size: "sm" | "md";
}) {
  if (total <= 0) return null;
  return (
    <div className={`pa-dots-row pa-dots-row--${size}`} aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`pa-dot ${i < filled ? "pa-dot--filled" : "pa-dot--empty"}`}
        />
      ))}
    </div>
  );
}

export function PaDotMeter({
  current,
  max,
  banked = 0,
  spentThisTurn,
  accumulationCap = PA_ACCUMULATION_CAP_DEFAULT,
  showLabel = true,
  size = "md",
  compact = false,
}: Props) {
  const recovery = Math.max(0, max);
  const normalized = normalizeTokenPaFields(
    { pa: current, paMax: recovery, bankedPa: banked } as import("@/lib/vtt/types").BattleToken,
    recovery,
    accumulationCap
  );
  const spendable = tokenSpendablePa({
    pa: normalized.pa,
    paMax: recovery,
    bankedPa: normalized.bankedPa,
  } as import("@/lib/vtt/types").BattleToken);
  const dotTotal = Math.max(accumulationCap, spendable);
  const filled = Math.min(dotTotal, spendable);
  const spent = spentThisTurn != null ? Math.max(0, spentThisTurn) : null;

  if (compact) {
    return <span className="pa-dot-meter-compact">{spendable} PA</span>;
  }

  return (
    <div className={`pa-dot-meter pa-dot-meter--${size}`}>
      <div className="pa-dot-meter-head">
        <span className="pa-dot-meter-title">Pontos de ação</span>
        {showLabel ? (
          <span className="pa-dot-meter-count">
            {spendable} PA
            <span className="pa-dot-meter-base">
              {" "}
              · recupera {recovery}/turno · acumula até {accumulationCap}
            </span>
          </span>
        ) : null}
      </div>
      <DotRow total={dotTotal} filled={filled} size={size} />
      <p className="pa-dot-meter-banked-hint pa-dot-meter-banked-hint--dim">
        Sem teto de gasto no turno — bônus de PA podem aumentar o que você gasta agora; só a sobra
        guardada no fim do turno respeita o teto de {accumulationCap}.
      </p>
      {spent != null && spent > 0 ? (
        <p className="pa-dot-meter-spent">Gastos neste turno: {spent} PA</p>
      ) : null}
    </div>
  );
}
