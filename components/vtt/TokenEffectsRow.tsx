"use client";

import type { BattleToken } from "@/lib/vtt/types";
import { listTokenEffectChips } from "@/lib/vtt/token-effects";
import { TokenEffectIcon } from "@/components/vtt/TokenEffectIcon";
import { effectTipAttrs } from "@/components/vtt/EffectHoverTip";

type Props = {
  token: BattleToken;
  /** compact = ícone; full = ícone + nome */
  variant?: "compact" | "full";
  className?: string;
  max?: number;
};

export function TokenEffectsRow({
  token,
  variant = "compact",
  className = "",
  max = 8,
}: Props) {
  const chips = listTokenEffectChips(token);
  if (chips.length === 0) return null;

  const shown = chips.slice(0, max);
  const extra = chips.length - shown.length;

  return (
    <div
      className={`vtt-effect-chips${className ? ` ${className}` : ""}`}
      role="list"
      aria-label="Condições e buffs"
    >
      {shown.map((chip) => (
        <span
          key={chip.id}
          role="listitem"
          {...effectTipAttrs(
            chip.title,
            `vtt-effect-chip vtt-effect-chip--${chip.kind}${variant === "compact" ? " vtt-effect-chip--icon" : ""}`
          )}
          style={
            {
              "--chip-bg": chip.bg,
              "--chip-fg": chip.color,
            } as React.CSSProperties
          }
          aria-label={chip.title}
        >
          <span className="vtt-effect-chip-icon-wrap">
            <TokenEffectIcon icon={chip.icon} size={variant === "full" ? 13 : 14} />
            {chip.remaining ? (
              <span className="vtt-effect-chip-badge" aria-hidden>
                {chip.remaining}
              </span>
            ) : null}
          </span>
          {variant === "full" ? <span className="vtt-effect-chip-label">{chip.label}</span> : null}
        </span>
      ))}
      {extra > 0 ? (
        <span className="vtt-effect-chip vtt-effect-chip--more" title={`+${extra} efeitos`}>
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
