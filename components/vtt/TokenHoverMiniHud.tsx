"use client";

import type { CombatTrack } from "@/lib/room/combat";
import type { BattleToken } from "@/lib/vtt/types";
import {
  hpBarPercent,
  miniHudModeForViewer,
  obscuredHpBarColor,
  turnOrderHint,
} from "@/lib/vtt/combat-hud";
import { hexToMeters, walkRemaining } from "@/lib/vtt/movement";
import { hpBarColor, hpRatio } from "@/lib/vtt/token-hp-display";

type Props = {
  token: BattleToken;
  combat: CombatTrack | null | undefined;
  anchor: { x: number; y: number };
  isGm: boolean;
  viewerToken: BattleToken | null;
  showMonsterHpToPlayers?: boolean;
  /** Caminhada restante no turno (só no hover do token ativo). */
  showMovement?: boolean;
  /** Jogador: abrir bestiário individual do monstro. */
  showMonsterInfoAction?: boolean;
  onMonsterInfo?: () => void;
};

export function TokenHoverMiniHud({
  token,
  combat,
  anchor,
  isGm,
  viewerToken,
  showMonsterHpToPlayers = false,
  showMovement = false,
  showMonsterInfoAction = false,
  onMonsterInfo,
}: Props) {
  const mode = miniHudModeForViewer(token, { isGm, viewerToken, showMonsterHpToPlayers });
  const turn = turnOrderHint(combat, token.id);
  const ratio = hpRatio(token);

  return (
    <div
      className={`vtt-mini-hud glass-panel${turn?.isActive ? " vtt-mini-hud--active" : ""}`}
      style={{
        left: anchor.x,
        top: anchor.y,
        transform: "translate(-50%, calc(-100% - 10px))",
      }}
      role="tooltip"
    >
      <strong className="vtt-mini-hud__name">{token.name}</strong>

      {mode === "full" && token.vidaMax != null ? (
        <div className="vtt-mini-hud__hp">
          <div className="vtt-mini-hud__hp-track" aria-hidden>
            <div
              className="vtt-mini-hud__hp-fill"
              style={{ width: `${hpBarPercent(token)}%`, background: hpBarColor(ratio) }}
            />
          </div>
          <span>
            {token.vida ?? 0}/{token.vidaMax}
          </span>
        </div>
      ) : mode === "obscured" ? (
        <div className="vtt-mini-hud__hp vtt-mini-hud__hp--obscured">
          <div className="vtt-mini-hud__hp-track" aria-hidden>
            <div
              className="vtt-mini-hud__hp-fill vtt-mini-hud__hp-fill--obscured"
              style={{ background: obscuredHpBarColor() }}
            />
          </div>
          <span className="vtt-mini-hud__hp-obscured">??/??</span>
        </div>
      ) : null}

      {showMovement ? (
        <span className="vtt-mini-hud__move">
          {walkRemaining(token)} hex · {hexToMeters(walkRemaining(token))} m
        </span>
      ) : null}

      {showMonsterInfoAction && onMonsterInfo ? (
        <button
          type="button"
          className="vtt-mini-hud__info-btn"
          onClick={(e) => {
            e.stopPropagation();
            onMonsterInfo();
          }}
        >
          Exibir informações
        </button>
      ) : null}

      {turn ? (
        <span
          className={`vtt-mini-hud__turn${turn.isActive ? " vtt-mini-hud__turn--now" : ""}`}
        >
          {turn.label}
        </span>
      ) : null}
    </div>
  );
}
