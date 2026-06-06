"use client";

import { useEffect, useRef } from "react";
import type { BattleToken } from "@/lib/vtt/types";
import type { CombatTrack } from "@/lib/room/combat";
import { TokenStatusList } from "@/components/vtt/TokenStatusList";
import { TokenConditionsPanel } from "@/components/vtt/TokenConditionsPanel";
import { PaHudMeter } from "@/components/vtt/PaHudMeter";
import { hpBarColor, hpRatio } from "@/lib/vtt/token-hp-display";

type Props = {
  open: boolean;
  token: BattleToken | null;
  roomId: string;
  combat: CombatTrack | null | undefined;
  canApplyConditions: boolean;
  onClose: () => void;
  onUpdate: () => void;
};

export function TokenStatusModal({
  open,
  token,
  roomId,
  combat,
  canApplyConditions,
  onClose,
  onUpdate,
}: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !token) return null;

  return (
    <div
      className="vtt-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="vtt-modal-panel glass vtt-status-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-status-title"
      >
        <h3 id="token-status-title" className="vtt-modal-title">
          Status
        </h3>
        <p className="vtt-modal-lead">
          <strong style={{ color: token.color }}>{token.name}</strong>
        </p>

        {token.vidaMax != null ? (
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
          Passe o mouse sobre um status para ver a descrição do efeito e a duração restante.
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
            Condições são aplicadas pelo mestre na mesa. Aqui você só consulta os efeitos ativos no
            seu personagem.
          </p>
        )}

        <div className="vtt-modal-actions">
          <button ref={closeRef} type="button" className="btn btn-ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
