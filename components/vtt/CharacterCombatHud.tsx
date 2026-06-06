"use client";

import { useState } from "react";
import type { CombatTrack } from "@/lib/room/combat";
import { activeTokenId } from "@/lib/room/combat";
import type { RoomSnapshot } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";
import { hpBarColor, hpRatio } from "@/lib/vtt/token-hp-display";
import { nextCombatTurn } from "@/hooks/useRoomSync";
import { PaHudMeter } from "@/components/vtt/PaHudMeter";
import { TokenEffectsRow } from "@/components/vtt/TokenEffectsRow";

type Props = {
  token: BattleToken;
  combat: CombatTrack | null | undefined;
  isGmView: boolean;
  isControlled: boolean;
  canViewPa: boolean;
  canEndTurn: boolean;
  roomId: string;
  onOpenStatus: () => void;
  onOpenSheet?: (actorId?: string) => void;
  onSnapshot?: (snap: RoomSnapshot) => void;
  onUpdate: () => void;
  onHide: () => void;
};

export function CharacterCombatHud({
  token,
  combat,
  isGmView,
  isControlled,
  canViewPa,
  canEndTurn,
  roomId,
  onOpenStatus,
  onOpenSheet,
  onSnapshot,
  onUpdate,
  onHide,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const activeId = combat ? activeTokenId(combat) : null;
  const isYourTurn = Boolean(activeId && token.id === activeId && isControlled);
  const ratio = hpRatio(token);
  const hpPct = Math.round(ratio * 100);
  const barColor = hpBarColor(ratio);

  async function handleEndTurn() {
    setBusy(true);
    setErr(null);
    try {
      const snap = await nextCombatTurn(roomId);
      onSnapshot?.(snap);
      onUpdate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não foi possível passar o turno");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`vtt-combat-hud glass-panel${isYourTurn ? " vtt-combat-hud--your-turn" : ""}${isGmView ? " vtt-combat-hud--gm" : ""}`}
      role="region"
      aria-label={`Status de ${token.name}`}
    >
      <button
        type="button"
        className="vtt-combat-hud__hide"
        title="Ocultar HUD (pode reabrir pelo botão na barra)"
        onClick={onHide}
      >
        Ocultar
      </button>

      <div className="vtt-combat-hud__body">
        <div
          className="vtt-combat-hud__portrait"
          style={{ borderColor: token.color, boxShadow: `0 0 12px ${token.color}55` }}
          aria-hidden
        >
          <span style={{ color: token.color }}>{token.name.slice(0, 1)}</span>
        </div>

        <div className="vtt-combat-hud__main">
          <div className="vtt-combat-hud__head">
            <strong className="vtt-combat-hud__name" style={{ color: token.color }}>
              {token.name}
            </strong>
            {isYourTurn ? (
              <span className="vtt-combat-hud__turn-pill">Seu turno</span>
            ) : isGmView && activeId === token.id ? (
              <span className="vtt-combat-hud__turn-pill vtt-combat-hud__turn-pill--gm">
                Turno ativo
              </span>
            ) : null}
            {combat?.round ? (
              <span className="vtt-combat-hud__round">R{combat.round}</span>
            ) : null}
          </div>

          {token.vidaMax != null ? (
            <div className="vtt-combat-hud__hp">
              <div className="vtt-combat-hud__hp-track" aria-hidden>
                <div
                  className="vtt-combat-hud__hp-fill"
                  style={{ width: `${hpPct}%`, background: barColor }}
                />
              </div>
              <span className="vtt-combat-hud__hp-text">
                {token.vida ?? 0}/{token.vidaMax}
              </span>
            </div>
          ) : null}

          <div className="vtt-combat-hud__stats">
            {token.defesa != null ? (
              <span className="vtt-combat-hud__stat">
                CA <strong>{token.defesa}</strong>
                {token.defesaBonus ? ` +${token.defesaBonus}` : ""}
              </span>
            ) : null}
            {canViewPa ? <PaHudMeter token={token} /> : null}
          </div>

          <TokenEffectsRow token={token} className="vtt-combat-hud__effects" max={4} />
        </div>

        <div className="vtt-combat-hud__actions">
          <button type="button" className="btn btn-ghost vtt-combat-hud__btn" onClick={onOpenStatus}>
            Status
          </button>
          {token.linked && onOpenSheet ? (
            <button
              type="button"
              className="btn btn-ghost vtt-combat-hud__btn"
              onClick={() => onOpenSheet(token.actorId)}
            >
              Ficha
            </button>
          ) : null}
          {canEndTurn &&
          combat?.order.length &&
          activeId === token.id &&
          (isYourTurn || isGmView) ? (
            <button
              type="button"
              className="btn vtt-combat-hud__end-turn"
              disabled={busy}
              onClick={() => void handleEndTurn()}
            >
              {busy ? "…" : "Passar turno"}
            </button>
          ) : null}
        </div>
      </div>

      {err ? <p className="dice-err vtt-combat-hud__err">{err}</p> : null}
    </div>
  );
}
