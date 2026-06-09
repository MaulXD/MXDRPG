"use client";

import { useState } from "react";
import type { CombatTrack } from "@/lib/room/combat";
import { activeTokenId } from "@/lib/room/combat";
import type { RoomSnapshot } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";
import { hpRatio } from "@/lib/vtt/token-hp-display";
import { listTokenEffectChips } from "@/lib/vtt/token-effects";
import { nextCombatTurn } from "@/hooks/useRoomSync";
import { useImageNaturalSize } from "@/hooks/useImageNaturalSize";
import { PaHudMeter } from "@/components/vtt/PaHudMeter";
import { TokenEffectsRow } from "@/components/vtt/TokenEffectsRow";
import { firstPortraitDataUrl } from "@/lib/room/portrait-sync";
import {
  DEFAULT_PORTRAIT_FOCUS,
  sanitizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
import { resolvePortraitFrameTier } from "@/lib/vtt/portrait-frame";
import { Portrait } from "@/components/vtt/Portrait";
import { HudCorners } from "@/components/vtt/HudCorners";
import {
  canShowMonsterSheetButton,
  resolveMonsterSheetOpenTarget,
} from "@/lib/vtt/monster-sheet-access";

type Props = {
  token: BattleToken;
  combat: CombatTrack | null | undefined;
  isGmView: boolean;
  isControlled: boolean;
  canViewPa: boolean;
  canEndTurn: boolean;
  canControlCombat?: boolean;
  roomId: string;
  onOpenSheet?: (actorId?: string) => void;
  onOpenMonsterSheet?: (entryId: string) => void;
  onSnapshot?: (snap: RoomSnapshot) => void;
  onUpdate: () => void;
  onHide: () => void;
  portraitFallback?: string | null;
  portraitFocus?: PortraitFocus | null;
};

function HudCaShield({ value }: { value: number }) {
  return (
    <div className="hud-ca" title={`Classe de armadura ${value}`}>
      <div className="hud-ca-shield">
        <svg viewBox="0 0 32 36" fill="none" aria-hidden>
          <path
            d="M16 2 L30 8.5 V17.5 C30 25.5 24 31.5 16 34 C8 31.5 2 25.5 2 17.5 V8.5 Z"
            fill="rgba(8, 12, 18, 0.75)"
            stroke="rgba(201, 169, 98, 0.55)"
            strokeWidth="1.5"
          />
        </svg>
        <span className="hud-ca-value">{value}</span>
      </div>
      <span className="hud-ca-label">CA</span>
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
  canControlCombat = false,
  roomId,
  onOpenSheet,
  onOpenMonsterSheet,
  onSnapshot,
  onUpdate,
  onHide,
  portraitFallback = null,
  portraitFocus = null,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const activeId = combat ? activeTokenId(combat) : null;
  const isYourTurn = Boolean(activeId && token.id === activeId && isControlled);
  const ratio = hpRatio(token);
  const hpPct = Math.round(ratio * 100);
  const hasStatusEffects = listTokenEffectChips(token).length > 0;
  const portraitSrc = firstPortraitDataUrl(token.imageUrl, portraitFallback);
  const imgSize = useImageNaturalSize(portraitSrc);
  const focus =
    sanitizePortraitFocus(portraitFocus) ??
    sanitizePortraitFocus(token.imageFocus) ??
    DEFAULT_PORTRAIT_FOCUS;
  const frameTier = resolvePortraitFrameTier(token);

  const showEndTurn =
    canEndTurn &&
    Boolean(combat?.order?.length) &&
    Boolean(activeId) &&
    (canControlCombat || (activeId === token.id && isYourTurn));

  const sheetTarget = resolveMonsterSheetOpenTarget(token);
  const showSheetButton =
    canShowMonsterSheetButton(token) &&
    ((sheetTarget?.kind === "actor" && onOpenSheet) ||
      (sheetTarget?.kind === "compendium" && onOpenMonsterSheet));

  function handleOpenSheet() {
    if (!sheetTarget) return;
    if (sheetTarget.kind === "actor") {
      onOpenSheet?.(sheetTarget.actorId);
      return;
    }
    onOpenMonsterSheet?.(sheetTarget.entryId);
  }

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

  const hudClass = [
    "vtt-combat-hud",
    isYourTurn ? "vtt-combat-hud--your-turn" : "",
    isGmView ? "vtt-combat-hud--gm" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="vtt-hud-wrapper" role="region" aria-label={`HUD de ${token.name}`}>
      {hasStatusEffects ? (
        <div className="vtt-hud-effects" aria-label="Efeitos ativos">
          <TokenEffectsRow token={token} surface="hud-v4" max={14} />
        </div>
      ) : null}

      <div className={hudClass}>
        <div className="hud-corners-layer" aria-hidden>
          <HudCorners emphasized={isYourTurn} />
        </div>

        <div className="hud-portrait-wrap">
          <Portrait
            tier={frameTier}
            imageSrc={portraitSrc}
            initials={portraitSrc ? undefined : token.name.slice(0, 1).toUpperCase()}
            alt={token.name}
            focus={focus}
            imgW={imgSize.w}
            imgH={imgSize.h}
            size="hud"
          />
        </div>

        <div className="hud-divider" aria-hidden />

        <div className="hud-body">
          <div className="hud-name-row">
            <span className="hud-name" title={token.name}>
              {token.name}
            </span>
            {token.vidaMax != null ? (
              <span className="hud-hp">
                {token.vida ?? 0} <span className="hud-hp-sep">/</span> {token.vidaMax}
              </span>
            ) : null}
          </div>

          {isYourTurn ? (
            <span className="hud-turn-badge">Seu turno</span>
          ) : isGmView && activeId === token.id ? (
            <span className="hud-turn-badge hud-turn-badge--gm">Turno ativo</span>
          ) : combat?.round ? (
            <span className="hud-round">R{combat.round}</span>
          ) : null}

          {token.vidaMax != null ? (
            <div className="hud-hp-track" aria-hidden>
              <div className="hud-hp-fill" style={{ width: `${hpPct}%` }} />
            </div>
          ) : null}

          <div className="hud-stats">
            {token.defesa != null ? <HudCaShield value={token.defesa} /> : null}
            {canViewPa ? <PaHudMeter token={token} variant="hud" /> : null}
          </div>
        </div>

        <div className="hud-actions">
          {showSheetButton ? (
            <button
              type="button"
              className="hud-btn"
              onClick={handleOpenSheet}
            >
              <svg viewBox="0 0 16 16" fill="none" aria-hidden>
                <rect x="2" y="1.5" width="12" height="13" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1" />
                <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1" />
                <line x1="5" y1="11" x2="9" y2="11" stroke="currentColor" strokeWidth="1" />
              </svg>
              <span className="hud-btn-label">Ficha</span>
            </button>
          ) : null}
          {showEndTurn ? (
            <button
              type="button"
              className="hud-btn hud-btn--pass"
              disabled={busy}
              onClick={() => void handleEndTurn()}
            >
              <svg viewBox="0 0 16 16" fill="none" aria-hidden>
                <polyline
                  points="3,8 7,12 13,4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hud-btn-label">{busy ? "…" : "Passar"}</span>
            </button>
          ) : null}
          <button
            type="button"
            className="hud-btn hud-btn--hide"
            title="Ocultar HUD"
            aria-label="Ocultar HUD"
            onClick={onHide}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M1.5 8s2-4.5 6.5-4.5S14.5 8 14.5 8"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
              <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span className="hud-btn-label">Ocultar</span>
          </button>
        </div>
      </div>

      {err ? <p className="dice-err vtt-combat-hud__err">{err}</p> : null}
    </div>
  );
}
