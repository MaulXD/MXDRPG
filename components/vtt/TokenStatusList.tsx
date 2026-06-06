"use client";

import type { BattleToken } from "@/lib/vtt/types";
import { listTokenEffectChips } from "@/lib/vtt/token-effects";
import { TokenEffectIcon } from "@/components/vtt/TokenEffectIcon";
import { effectTipAttrs } from "@/components/vtt/EffectHoverTip";

type Props = {
  token: BattleToken;
};

export function TokenStatusList({ token }: Props) {
  const chips = listTokenEffectChips(token);

  if (chips.length === 0) {
    return <p className="vtt-status-empty">Nenhum status ativo no momento.</p>;
  }

  return (
    <ul className="vtt-status-list" role="list" aria-label="Status ativos">
      {chips.map((chip) => (
        <li
          key={chip.id}
          {...effectTipAttrs(chip.title, `vtt-status-item vtt-status-item--${chip.kind}`)}
        >
          <span
            className="vtt-status-item-icon"
            style={
              {
                "--chip-bg": chip.bg,
                "--chip-fg": chip.color,
              } as React.CSSProperties
            }
          >
            <TokenEffectIcon icon={chip.icon} size={18} />
            {chip.remaining ? (
              <span className="vtt-status-item-badge" aria-hidden>
                {chip.remaining}
              </span>
            ) : null}
          </span>
          <span className="vtt-status-item-body">
            <span className="vtt-status-item-label">{chip.label}</span>
            <span className="vtt-status-item-desc">{chip.description}</span>
            {chip.durationLabel ? (
              <span className="vtt-status-item-duration">Duração: {chip.durationLabel}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
