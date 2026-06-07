"use client";

import { useState } from "react";
import type { CombatTrack } from "@/lib/room/combat";
import { activeTokenId } from "@/lib/room/combat";
import type { RoomSnapshot } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";
import { hpBarColor, hpRatio } from "@/lib/vtt/token-hp-display";
import { listTokenEffectChips } from "@/lib/vtt/token-effects";
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
  onOpenSheet?: (actorId?: string) => void;
  onSnapshot?: (snap: RoomSnapshot) => void;
  onUpdate: () => void;
  onHide: () => void;
};

function AcShield({ value, bonus }: { value: number; bonus?: number }) {
  return (
    <div className="vtt-combat-hud__ac" title={`Classe de armadura ${value}`}>
      <svg className="vtt-combat-hud__ac-icon" viewBox="0 0 32 36" aria-hidden>
        <path
          d="M16 2 L30 8.5 V17.5 C30 25.5 24 31.5 16 34 C8 31.5 2 25.5 2 17.5 V8.5 Z"
          fill="rgba(8, 12, 18, 0.75)"
          stroke="rgba(201, 169, 98, 0.55)"
          strokeWidth="1.5"
        />
      </svg>
      <span className="vtt-combat-hud__ac-value">{value}</span>
      {bonus ? <span className="vtt-combat-hud__ac-bonus">+{bonus}</span> : null}
    </div>
  );
}

export function CharacterCombatHud({
  token,
  combat,
  isGmView,
  isControlled,
  canViewPa,
  canEndTurn,
  roomId,
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
  const hasStatusEffects = listTokenEffectChips(token).length > 0;

  const showEndTurn =
    canEndTurn &&
    combat?.order.length &&
    activeId === token.id &&
    (isYourTurn || isGmView);

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
      aria-label={`HUD de ${token.name}`}
    >
      <button
        type="button"
        className="vtt-combat-hud__hide"
        title="Ocultar HUD (pode reabrir pelo botão na barra)"
        aria-label="Ocultar HUD"
        onClick={onHide}
      >
        <svg className="vtt-combat-hud__hide-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
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
          <path d="m3 3 18 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>

      {hasStatusEffects ? (
        <div className="vtt-combat-hud__status-bar" aria-label="Efeitos ativos">
          <TokenEffectsRow token={token} className="vtt-effect-chips--hud-bar" max={14} />
        </div>
      ) : null}

      <div className="vtt-combat-hud__body">
        <div
          className="vtt-combat-hud__portrait"
          style={{ borderColor: token.color, boxShadow: `0 0 14px ${token.color}44` }}
        >
          {token.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={token.imageUrl} alt="" className="vtt-combat-hud__portrait-img" />
          ) : (
            <span className="vtt-combat-hud__portrait-fallback" style={{ color: token.color }}>
              {token.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <div className="vtt-combat-hud__core">
          <div className="vtt-combat-hud__name-row">
            <div className="vtt-combat-hud__name-wrap">
              <strong className="vtt-combat-hud__name">{token.name}</strong>
              {isYourTurn ? (
                <span className="vtt-combat-hud__turn-pill">Seu turno</span>
              ) : isGmView && activeId === token.id ? (
                <span className="vtt-combat-hud__turn-pill vtt-combat-hud__turn-pill--gm">
                  Turno ativo
                </span>
              ) : combat?.round ? (
                <span className="vtt-combat-hud__round-inline">R{combat.round}</span>
              ) : null}
            </div>
            {token.vidaMax != null ? (
              <span className="vtt-combat-hud__hp-text" style={{ color: barColor }}>
                {token.vida ?? 0}/{token.vidaMax}
              </span>
            ) : null}
          </div>

          {token.vidaMax != null ? (
            <div className="vtt-combat-hud__hp-track" aria-hidden>
              <div
                className="vtt-combat-hud__hp-fill"
                style={{ width: `${hpPct}%`, background: barColor }}
              />
            </div>
          ) : null}

          <div className="vtt-combat-hud__resources">
            {token.defesa != null ? (
              <AcShield value={token.defesa} bonus={token.defesaBonus} />
            ) : null}
            {canViewPa ? <PaHudMeter token={token} variant="hud" /> : null}
          </div>
        </div>

        <div className="vtt-combat-hud__actions">
          {token.linked && onOpenSheet ? (
            <button
              type="button"
              className="vtt-combat-hud__btn-sheet"
              onClick={() => onOpenSheet(token.actorId)}
            >
              Ficha
            </button>
          ) : (
            <span className="vtt-combat-hud__actions-spacer" aria-hidden />
          )}
          {showEndTurn ? (
            <button
              type="button"
              className="vtt-combat-hud__end-turn"
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
