"use client";

import type { CombatTrack } from "@/lib/room/combat";
import type { BattleToken } from "@/lib/vtt/types";
import {
  hpBarPercent,
  miniHudModeForViewer,
  monsterDamageTaken,
  turnOrderHint,
  type MiniHudMode,
} from "@/lib/vtt/combat-hud";
import { hexToMeters, walkRemaining } from "@/lib/vtt/movement";
import { hpBarColor, hpRatio } from "@/lib/vtt/token-hp-display";

type Props = {
  token: BattleToken;
  combat: CombatTrack | null | undefined;
  anchor: { x: number; y: number };
  isGm: boolean;
  viewerToken: BattleToken | null;
  /** Caminhada restante no turno (só no hover do token ativo). */
  showMovement?: boolean;
};

export function TokenHoverMiniHud({
  token,
  combat,
  anchor,
  isGm,
  viewerToken,
  showMovement = false,
}: Props) {
  const mode: MiniHudMode = miniHudModeForViewer(token, { isGm, viewerToken });
  if (mode === "none") return null;

  const turn = turnOrderHint(combat, token.id);
  const ratio = hpRatio(token);
  const damage = monsterDamageTaken(token);

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
      <strong className="vtt-mini-hud__name" style={{ color: token.color }}>
        {token.name}
      </strong>

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
      ) : mode === "damage" ? (
        <p className="vtt-mini-hud__damage">
          Dano recebido: <strong>{damage}</strong> PV
        </p>
      ) : null}

      {showMovement ? (
        <span className="vtt-mini-hud__move">
          {walkRemaining(token)} hex · {hexToMeters(walkRemaining(token))} m
        </span>
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
