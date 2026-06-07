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
  /** hud-v4 = chips Eldarin v4 com tooltip inline */
  surface?: "default" | "hud-v4";
  className?: string;
  max?: number;
};

function chipVariant(kind: TokenEffectChip["kind"]): "danger" | "success" | "warn" | "info" {
  if (kind === "buff") return "success";
  if (kind === "debuff") return "warn";
  return "danger";
}

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
  surface = "default",
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

  if (surface === "hud-v4") {
    return (
      <div className="vtt-hud-effects-row" role="list" aria-label="Condições e buffs">
        {shown.map((chip) => (
          <div
            key={chip.id}
            role="listitem"
            className={`condition-chip condition-chip--${chipVariant(chip.kind)}`}
            aria-label={chip.title}
          >
            <TokenEffectIcon icon={chip.icon} size={12} className="condition-chip__icon" />
            <span className="condition-chip__label">{chip.label}</span>
            <div className="condition-chip__tooltip">
              <div className="condition-chip__tooltip-name">{chip.label}</div>
              <div className="condition-chip__tooltip-desc">{chip.description}</div>
              {chip.durationLabel ? (
                <div className="condition-chip__tooltip-turns">
                  Duração: {chip.durationLabel}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {extra > 0 ? (
          <span className="condition-chip condition-chip--info" title={`+${extra} efeitos`}>
            <span className="condition-chip__label">+{extra}</span>
          </span>
        ) : null}
      </div>
    );
  }

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
