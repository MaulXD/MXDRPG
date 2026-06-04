"use client";

import type { BattleToken } from "@/lib/vtt/types";
import type { TokenCondition } from "@/lib/combat/conditions";
import { toggleTokenCondition } from "@/lib/combat/conditions";
import { patchRoomToken } from "@/hooks/useRoomSync";
import { ALL_TOKEN_CONDITIONS, CONDITION_META } from "@/lib/vtt/token-effects";
import { TokenEffectIcon } from "@/components/vtt/TokenEffectIcon";
import { TokenEffectsRow } from "@/components/vtt/TokenEffectsRow";

type Props = {
  roomId: string;
  token: BattleToken;
  canEdit: boolean;
  onUpdate: () => void;
};

export function TokenConditionsPanel({ roomId, token, canEdit, onUpdate }: Props) {
  if (!canEdit) return null;

  async function toggle(condition: TokenCondition) {
    const next = toggleTokenCondition(token, condition);
    await patchRoomToken(roomId, token.id, { conditions: next });
    onUpdate();
  }

  const active = token.conditions ?? [];

  return (
    <div className="vtt-conditions-panel">
      <TokenEffectsRow token={token} variant="full" className="vtt-effect-chips--panel" />
      <p className="vtt-eyebrow">Condições (Cap. 3.4)</p>
      <div className="vtt-conditions-grid">
        {ALL_TOKEN_CONDITIONS.map((c) => (
          <button
            key={c}
            type="button"
            className={`btn btn-ghost vtt-condition-btn${active.includes(c) ? " active" : ""}`}
            onClick={() => void toggle(c)}
            title={CONDITION_META[c].label}
          >
            <TokenEffectIcon icon={CONDITION_META[c].icon} size={16} />
            <span>{CONDITION_META[c].label}</span>
          </button>
        ))}
      </div>
      <p className="vtt-combat-hint">
        Vantagem/desvantagem aplicam em ataque e save automaticamente.
      </p>
    </div>
  );
}
