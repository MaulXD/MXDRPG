"use client";

import type { BattleToken } from "@/lib/vtt/types";
import type { CombatTrack } from "@/lib/room/combat";
import { TokenStatusList } from "@/components/vtt/TokenStatusList";
import { TokenConditionsPanel } from "@/components/vtt/TokenConditionsPanel";
import { PaHudMeter } from "@/components/vtt/PaHudMeter";
import { hpBarColor, hpRatio } from "@/lib/vtt/token-hp-display";

type Props = {
  token: BattleToken;
  roomId: string;
  combat: CombatTrack | null | undefined;
  canApplyConditions: boolean;
  onUpdate: () => void;
  compact?: boolean;
};

export function TokenStatusBody({
  token,
  roomId,
  combat,
  canApplyConditions,
  onUpdate,
  compact = false,
}: Props) {
  return (
    <div className={`vtt-status-body${compact ? " vtt-status-body--compact" : ""}`}>
      {!compact && token.vidaMax != null ? (
        <div className="vtt-status-modal-vitals">
          <div className="vtt-status-modal-hp">
            <div className="vtt-combat-hud__hp-track" aria-hidden>
              <div
                className="vtt-combat-hud__hp-fill"
                style={{
                  width: `${Math.round(hpRatio(token) * 100)}%`,
                  background: hpBarColor(hpRatio(token)),
                }}
              />
            </div>
            <span>
              {token.vida ?? 0}/{token.vidaMax} HP
            </span>
          </div>
          {token.defesa != null ? (
            <span className="vtt-status-modal-stat">CA {token.defesa}</span>
          ) : null}
          <PaHudMeter token={token} />
        </div>
      ) : null}

      <p className="vtt-eyebrow">Ativos agora</p>
      <TokenStatusList token={token} />
      <p className="vtt-combat-hint vtt-status-hover-hint">
        Passe o mouse sobre um status para ver descrição e duração.
      </p>

      {canApplyConditions ? (
        <TokenConditionsPanel
          roomId={roomId}
          token={token}
          canEdit
          combatRound={combat?.round ?? 1}
          combatActiveIndex={combat?.activeIndex ?? 0}
          onUpdate={onUpdate}
        />
      ) : (
        <p className="vtt-combat-hint vtt-status-player-hint">
          Condições são aplicadas pelo mestre. Aqui você consulta os efeitos ativos.
        </p>
      )}
    </div>
  );
}
