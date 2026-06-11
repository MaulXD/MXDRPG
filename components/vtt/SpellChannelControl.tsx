"use client";

import type { CharacterSheet } from "@/lib/character/types";
import type { CombatActionOption } from "@/lib/combat/types";
import {
  CHANNEL_MAX_EXTRA_PA,
  clampChannelExtraPa,
  formatChannelPaLabel,
  totalChannelPaCost,
} from "@/lib/combat/spell-channel";
import { checkCanSpendPa } from "@/lib/combat/pa-turn";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  action: CombatActionOption;
  token: BattleToken;
  actor: CharacterSheet | null;
  value: number;
  onChange: (extraPa: number) => void;
};

export function SpellChannelControl({ action, token, actor, value, onChange }: Props) {
  if (!action.channelMaxExtraPa) return null;

  const max = Math.min(action.channelMaxExtraPa, CHANNEL_MAX_EXTRA_PA);
  const extra = clampChannelExtraPa(action, value);
  const totalPa = totalChannelPaCost(actor, action, extra, token);
  const paOk = checkCanSpendPa(token, totalPa).ok;
  const bonus = action.channelBonusPerPa ?? "1d6";

  return (
    <div className="vtt-channel-control">
      <p className="vtt-channel-title">Canalizar energia</p>
      <p className="vtt-channel-hint">
        +0 a +{max} PA extras · {bonus} de dano por PA (não reduz com Afinidade)
      </p>
      <div className="vtt-channel-steps" role="group" aria-label="PA extras de canalização">
        {Array.from({ length: max + 1 }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`btn btn-ghost vtt-channel-step${extra === i ? " is-active" : ""}`}
            onClick={() => onChange(i)}
          >
            +{i} PA
          </button>
        ))}
      </div>
      <p className={`vtt-channel-cost${paOk ? "" : " vtt-channel-cost--err"}`}>
        {formatChannelPaLabel(actor, action, extra, token)} · {token.pa} PA disponíveis
      </p>
    </div>
  );
}
