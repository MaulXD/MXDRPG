"use client";

import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  token: BattleToken;
  onShow: () => void;
};

export function CombatHudRestoreButton({ token, onShow }: Props) {
  return (
    <button
      type="button"
      className="vtt-combat-hud-restore glass-panel"
      onClick={onShow}
      aria-label={`Exibir HUD de ${token.name}`}
    >
      <span className="vtt-combat-hud-restore__icon" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M2 12s3.5-7 10-7 10 7 10 7-1.2 2.2-3.2 3.8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="vtt-combat-hud-restore__copy">
        <strong className="vtt-combat-hud-restore__title">Exibir HUD</strong>
        <span className="vtt-combat-hud-restore__name" style={{ color: token.color }}>
          {token.name}
        </span>
      </span>
    </button>
  );
}
