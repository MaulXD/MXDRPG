"use client";

import { useCallback, useState, type MouseEvent } from "react";
import type { BattleToken } from "@/lib/vtt/types";
import { listTokenEffectChips, type TokenEffectChip } from "@/lib/vtt/token-effects";
import { TokenEffectIcon } from "@/components/vtt/TokenEffectIcon";
import { EffectCursorDetail } from "@/components/vtt/EffectCursorDetail";

type Props = {
  token: BattleToken;
  /** compact = ícone; full = ícone + nome */
  variant?: "compact" | "full";
  className?: string;
  max?: number;
};

function EffectChipDetail({ chip }: { chip: TokenEffectChip }) {
  return (
    <>
      <p className="vtt-effect-cursor-detail__title">{chip.label}</p>
      <p className="token-action-ring__detail-hint">{chip.description}</p>
      {chip.durationLabel ? (
        <p className="vtt-effect-cursor-detail__duration">Duração: {chip.durationLabel}</p>
      ) : null}
    </>
  );
}

export function TokenEffectsRow({
  token,
  variant = "compact",
  className = "",
  max = 8,
}: Props) {
  const chips = listTokenEffectChips(token);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [infoPointer, setInfoPointer] = useState<{ x: number; y: number } | null>(null);

  const syncPointer = useCallback((e: MouseEvent<HTMLElement>) => {
    setInfoPointer({ x: e.clientX, y: e.clientY });
  }, []);

  if (chips.length === 0) return null;

  const shown = chips.slice(0, max);
  const extra = chips.length - shown.length;
  const activeChip = shown.find((c) => c.id === hoveredId) ?? null;

  return (
    <>
      <div
        className={`vtt-effect-chips${className ? ` ${className}` : ""}`}
        role="list"
        aria-label="Condições e buffs"
      >
        {shown.map((chip) => (
          <span
            key={chip.id}
            role="listitem"
            className={`vtt-effect-chip vtt-effect-chip--${chip.kind}${
              variant === "compact" ? " vtt-effect-chip--icon" : ""
            }${chip.remaining ? " vtt-effect-chip--has-badge" : ""}`}
            style={
              {
                "--chip-bg": chip.bg,
                "--chip-fg": chip.color,
              } as React.CSSProperties
            }
            aria-label={chip.title}
            onMouseEnter={(e) => {
              syncPointer(e);
              setHoveredId(chip.id);
            }}
            onMouseMove={(e) => {
              if (hoveredId === chip.id) syncPointer(e);
            }}
            onMouseLeave={() => {
              setHoveredId(null);
              setInfoPointer(null);
            }}
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

      {activeChip && infoPointer ? (
        <EffectCursorDetail pointer={infoPointer}>
          <EffectChipDetail chip={activeChip} />
        </EffectCursorDetail>
      ) : null}
    </>
  );
}
