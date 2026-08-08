"use client";

import type { BattleToken } from "@/lib/vtt/types";
import type { CombatTrack } from "@/lib/room/combat";
import { TokenStatusList } from "@/components/vtt/TokenStatusList";
import { TokenConditionsPanel } from "@/components/vtt/TokenConditionsPanel";
import { TokenDelegatePanel } from "@/components/vtt/TokenDelegatePanel";
import { PaHudMeter } from "@/components/vtt/PaHudMeter";
import { formatTokenHpLine, hpBarColor, hpRatio } from "@/lib/vtt/token-hp-display";
import { TOR_DEFAULT_STANCE, isTorStance, torStanceLabel } from "@/lib/combat/um-anel/stances";

type Props = {
  token: BattleToken;
  roomId: string;
  combat: CombatTrack | null | undefined;
  canApplyConditions: boolean;
  onUpdate: () => void;
  compact?: boolean;
  canDelegate?: boolean;
  delegateCandidates?: { userId: string; label: string }[];
};

export function TokenStatusBody({
  token,
  roomId,
  combat,
  canApplyConditions,
  onUpdate,
  compact = false,
  canDelegate = false,
  delegateCandidates = [],
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
            <span>{formatTokenHpLine(token)} HP</span>
          </div>
          {token.defesa != null ? (
            <span className="vtt-status-modal-stat">CA {token.defesa}</span>
          ) : null}
          {!token.torCombat ? <PaHudMeter token={token} /> : null}
          {/* A postura muda quem pode atacar quem (Retaguarda) e quantos Dados
              de Sucesso a rolagem leva — a mesa inteira precisa enxergar, não
              só quem abriu o popup de ataque daquele herói. */}
          {token.torCombat?.kind === "adversary" && token.torCombat.hate != null ? (
            <span className="vtt-status-modal-stat">
              {token.torCombat.hateKind === "resolve" ? "Resolução" : "Ódio"} {token.torCombat.hate}/
              {token.torCombat.hateMax ?? token.torCombat.hate}
            </span>
          ) : null}
          {token.torCombat?.kind === "hero" ? (
            <span className="vtt-status-modal-stat">
              Postura {torStanceLabel(isTorStance(token.torCombat.stance) ? token.torCombat.stance : TOR_DEFAULT_STANCE)}
            </span>
          ) : null}
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

      {canDelegate ? (
        <TokenDelegatePanel
          roomId={roomId}
          token={token}
          candidates={delegateCandidates}
          onUpdate={onUpdate}
        />
      ) : null}
    </div>
  );
}
