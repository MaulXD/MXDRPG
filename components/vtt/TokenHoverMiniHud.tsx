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
import { hpBarColor, hpRatio, isTokenDefeated } from "@/lib/vtt/token-hp-display";

type Props = {
  token: BattleToken;
  combat: CombatTrack | null | undefined;
  anchor: { x: number; y: number };
  isGm: boolean;
  viewerToken: BattleToken | null;
  showMonsterHpToPlayers?: boolean;
  /** Caminhada restante no turno (só no hover do token ativo). */
  showMovement?: boolean;
  /** Jogador: dica de clique direito no monstro. */
  showMonsterInfoHint?: boolean;
};

export function TokenHoverMiniHud({
  token,
  combat,
  anchor,
  isGm,
  viewerToken,
  showMonsterHpToPlayers = false,
  showMovement = false,
  showMonsterInfoHint = false,
}: Props) {
  const mode = miniHudModeForViewer(token, { isGm, viewerToken, showMonsterHpToPlayers });
  const turn = turnOrderHint(combat, token.id);
  const ratio = hpRatio(token);
  const defeated = isTokenDefeated(token);

  return (
    <div
      className={`vtt-mini-hud glass-panel${turn?.isActive ? " vtt-mini-hud--active" : ""}`}
      style={{
        left: anchor.x + 14,
        top: anchor.y,
        transform: "translateY(-50%)",
      }}
      role="tooltip"
    >
      <strong className="vtt-mini-hud__name">{token.name}</strong>

      {defeated ? (
        <span className="vtt-mini-hud__defeated">Morto</span>
      ) : mode === "full" && token.vidaMax != null ? (
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
          {walkRemaining(token)} cél. · {hexToMeters(walkRemaining(token))} m
        </span>
      ) : null}

      {showMonsterInfoHint ? (
        <p className="vtt-mini-hud__hint">Clique com o direito para exibir informações</p>
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
