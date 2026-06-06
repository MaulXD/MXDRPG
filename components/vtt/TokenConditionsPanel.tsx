"use client";

import { useState } from "react";
import type { BattleToken } from "@/lib/vtt/types";
import type { TokenCondition } from "@/lib/combat/conditions";
import { CONDITION_SUGGESTED_DURATIONS } from "@/lib/combat/buff-durations";
import { toggleConditionWithDuration } from "@/lib/combat/timed-effects";
import { patchRoomToken } from "@/hooks/useRoomSync";
import { ALL_TOKEN_CONDITIONS, CONDITION_META } from "@/lib/vtt/token-effects";
import { formatConditionCatalogTooltip } from "@/lib/vtt/status-display";
import { TokenEffectIcon } from "@/components/vtt/TokenEffectIcon";
import { EffectHoverTip } from "@/components/vtt/EffectHoverTip";

type DurationChoice = { roundsLeft?: number; turnsLeft?: number };

type Props = {
  roomId: string;
  token: BattleToken;
  canEdit: boolean;
  combatRound?: number;
  combatActiveIndex?: number;
  onUpdate: () => void;
};

const DURATION_OPTIONS: { label: string; value: DurationChoice | null }[] = [
  { label: "∞", value: null },
  { label: "1R", value: { roundsLeft: 1 } },
  { label: "2R", value: { roundsLeft: 2 } },
  { label: "3R", value: { roundsLeft: 3 } },
  { label: "1T", value: { turnsLeft: 1 } },
  { label: "2T", value: { turnsLeft: 2 } },
];

export function TokenConditionsPanel({
  roomId,
  token,
  canEdit,
  combatRound = 1,
  combatActiveIndex = 0,
  onUpdate,
}: Props) {
  const [pending, setPending] = useState<TokenCondition | null>(null);

  if (!canEdit) return null;

  const active = token.conditions ?? [];

  async function apply(condition: TokenCondition, duration: DurationChoice | null) {
    const ctx = { round: combatRound, activeIndex: combatActiveIndex };
    const next = toggleConditionWithDuration(token, condition, {
      ...duration,
      ctx,
    });
    await patchRoomToken(roomId, token.id, {
      conditions: next.conditions,
      timedEffects: next.timedEffects,
    });
    setPending(null);
    onUpdate();
  }

  return (
    <div className="vtt-conditions-panel">
      <p className="vtt-eyebrow">Aplicar condições (Cap. 3.4)</p>
      <div className="vtt-conditions-grid">
        {ALL_TOKEN_CONDITIONS.map((c) => (
          <EffectHoverTip
            key={c}
            tip={formatConditionCatalogTooltip(c, token)}
            className="vtt-condition-btn-wrap"
          >
            <button
              type="button"
              className={`btn btn-ghost vtt-condition-btn${active.includes(c) ? " active" : ""}${pending === c ? " pending" : ""}`}
              onClick={() => {
                if (active.includes(c)) {
                  void apply(c, null);
                  return;
                }
                setPending(pending === c ? null : c);
              }}
            >
              <TokenEffectIcon icon={CONDITION_META[c].icon} size={16} />
              <span>{CONDITION_META[c].label}</span>
            </button>
          </EffectHoverTip>
        ))}
      </div>

      {pending ? (
        <div className="vtt-condition-duration">
          <p
            className="vtt-condition-duration-label"
            title={formatConditionCatalogTooltip(pending, token)}
          >
            Duração — <strong>{CONDITION_META[pending].label}</strong>
            <span className="vtt-condition-duration-desc">{CONDITION_META[pending].description}</span>
            {CONDITION_SUGGESTED_DURATIONS[pending]?.note ? (
              <span className="vtt-condition-duration-desc">
                Sugestão: {CONDITION_SUGGESTED_DURATIONS[pending]?.note}
              </span>
            ) : null}
          </p>
          <div className="vtt-condition-duration-row">
            {CONDITION_SUGGESTED_DURATIONS[pending]?.turnsLeft ||
            CONDITION_SUGGESTED_DURATIONS[pending]?.roundsLeft ? (
              <button
                type="button"
                className="btn btn-ghost vtt-duration-btn vtt-duration-btn--suggested"
                title="Aplicar duração sugerida do livro"
                onClick={() =>
                  void apply(pending, {
                    turnsLeft: CONDITION_SUGGESTED_DURATIONS[pending]?.turnsLeft,
                    roundsLeft: CONDITION_SUGGESTED_DURATIONS[pending]?.roundsLeft,
                  })
                }
              >
                Sug.
              </button>
            ) : null}
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                className="btn btn-ghost vtt-duration-btn"
                title={
                  opt.value?.roundsLeft
                    ? `${opt.value.roundsLeft} rodada(s)`
                    : opt.value?.turnsLeft
                      ? `${opt.value.turnsLeft} turno(s)`
                      : "Sem contador — até remover"
                }
                onClick={() => void apply(pending, opt.value)}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-ghost vtt-duration-btn vtt-duration-btn--cancel"
              onClick={() => setPending(null)}
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}

      <p className="vtt-combat-hint">
        Clique para aplicar; escolha rodadas (R) ou turnos (T). Ícones no token mostram o que falta.
        Vantagem/desvantagem aplicam em ataque e save automaticamente.
      </p>
    </div>
  );
}
