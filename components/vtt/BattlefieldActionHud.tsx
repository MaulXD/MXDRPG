"use client";

import type { ActionPreview } from "@/lib/combat/action-preview";
import {
  hpBarPercent,
  miniHudModeForViewer,
  obscuredHpBarColor,
  type MiniHudMode,
} from "@/lib/vtt/combat-hud";
import { hpBarColor, hpRatio, isTokenDefeated } from "@/lib/vtt/token-hp-display";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  preview: ActionPreview | null;
  /** Ponto de ancoragem acima do alvo em px (relativo ao wrap do canvas). */
  anchor?: { x: number; y: number } | null;
  /** Alvo sob o cursor em modo ataque/magia/habilidade — nome e HP no HUD de preview. */
  targetToken?: BattleToken | null;
  isGm?: boolean;
  viewerToken?: BattleToken | null;
  showMonsterHpToPlayers?: boolean;
};

function TargetVitals({
  token,
  mode,
}: {
  token: BattleToken;
  mode: MiniHudMode;
}) {
  const ratio = hpRatio(token);
  const defeated = isTokenDefeated(token);

  return (
    <>
      <strong className="vtt-action-hud__target-name">{token.name}</strong>
      {defeated ? (
        <span className="vtt-mini-hud__defeated">Morto</span>
      ) : mode === "full" && token.vidaMax != null ? (
        <div className="vtt-action-hud__target-hp">
          <div className="vtt-action-hud__target-hp-track" aria-hidden>
            <div
              className="vtt-action-hud__target-hp-fill"
              style={{ width: `${hpBarPercent(token)}%`, background: hpBarColor(ratio) }}
            />
          </div>
          <span>
            {token.vida ?? 0}/{token.vidaMax}
          </span>
        </div>
      ) : mode === "obscured" ? (
        <div className="vtt-action-hud__target-hp vtt-action-hud__target-hp--obscured">
          <div className="vtt-action-hud__target-hp-track" aria-hidden>
            <div
              className="vtt-action-hud__target-hp-fill vtt-mini-hud__hp-fill--obscured"
              style={{ background: obscuredHpBarColor() }}
            />
          </div>
          <span className="vtt-mini-hud__hp-obscured">??/??</span>
        </div>
      ) : null}
    </>
  );
}

export function BattlefieldActionHud({
  preview,
  anchor,
  targetToken,
  isGm = false,
  viewerToken = null,
  showMonsterHpToPlayers = false,
}: Props) {
  if (!preview) return null;

  const anchored = anchor != null;
  const targetMode =
    targetToken && anchored
      ? miniHudModeForViewer(targetToken, { isGm, viewerToken, showMonsterHpToPlayers })
      : null;

  return (
    <div
      className={`vtt-action-hud glass-panel${anchored ? " vtt-action-hud--anchored" : ""}`}
      style={
        anchored
          ? { left: anchor.x, top: anchor.y, bottom: "auto", transform: "translate(-50%, -100%)" }
          : undefined
      }
      role="status"
      aria-live="polite"
    >
      <p className={`vtt-action-hud-pa${preview.ok ? "" : " vtt-action-hud-pa--err"}`}>
        {preview.paChip}
      </p>
      {targetToken && targetMode ? <TargetVitals token={targetToken} mode={targetMode} /> : null}
      <strong className="vtt-action-hud-title">{preview.title}</strong>
      <ul className="vtt-action-hud-lines">
        {preview.lines.map((line, i) => (
          <li key={i} className={line.tone ? `tone-${line.tone}` : undefined}>
            {line.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
