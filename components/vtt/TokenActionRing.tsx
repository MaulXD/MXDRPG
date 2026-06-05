"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { BattleToken } from "@/lib/vtt/types";
import type { RoomActor } from "@/lib/room/types";
import type { CombatTrack } from "@/lib/room/combat";
import type { CombatActionOption } from "@/lib/combat/types";
import {
  listTokenCombatActions,
  resolveCombatAction,
} from "@/lib/combat/attack";
import { effectivePaCost, totalAttackPaCost } from "@/lib/combat/pa-economy";
import { isActionOnRecharge } from "@/lib/combat/recharge";
import { totalChannelPaCost } from "@/lib/combat/spell-channel";
import type { TokenActionMode } from "@/lib/vtt/action-mode";
import { movementPaCost, movementPaBandsForToken } from "@/lib/vtt/movement-pa";
import { useCombatTurn } from "@/hooks/useCombatActions";
import { patchRoomActor } from "@/hooks/useRoomSync";
import { collectPlayerActorIds, primaryTokenRingColor } from "@/lib/vtt/token-colors";
import "./token-action-ring.css";

type SlotTone = "walk" | "run" | "attack" | "spell" | "ability";
type RingView = "main" | "spell" | "ability";

type DisplaySlot = {
  id: string;
  tone: SlotTone;
  label: string;
  glyph: string;
  paLabel: string;
  disabled?: boolean;
  title?: string;
  longLabel?: boolean;
  rechargeHint?: string;
  onClick: () => void;
};

type Props = {
  x: number;
  y: number;
  token: BattleToken;
  allTokens: BattleToken[];
  actor: RoomActor | null;
  combat: CombatTrack | null | undefined;
  canBypassTurn: boolean;
  roomId: string;
  onPickMode: (mode: TokenActionMode, action: CombatActionOption | null) => void;
  onClose: () => void;
  onRoomSync: () => void;
};

const RING_RADIUS_BASE = 123;

function ringLayout(slotCount: number): { radius: number; track: number; slotScale: number } {
  if (slotCount <= 5) {
    return { radius: RING_RADIUS_BASE, track: 252, slotScale: 1 };
  }
  if (slotCount <= 8) {
    return { radius: Math.round(RING_RADIUS_BASE * 1.18), track: 296, slotScale: 1.04 };
  }
  return { radius: Math.round(RING_RADIUS_BASE * 1.36), track: 340, slotScale: 1.08 };
}

function nextHexPaLabel(token: BattleToken): string {
  const bands = movementPaBandsForToken(token);
  const spent = token.movementSpentHex ?? 0;
  const cost = movementPaCost(spent, 1, bands);
  return cost === 0 ? "0 PA" : `${cost} PA`;
}

function combatActionPaLabel(actor: RoomActor | null, action: CombatActionOption | undefined): string {
  if (!action) return "—";
  if (action.channelMaxExtraPa) {
    const base = effectivePaCost(actor, action);
    return `${base}+ PA`;
  }
  if (actor && action.kind === "weapon") {
    const total = totalAttackPaCost(actor, action);
    return `${total} PA`;
  }
  if (actor && (action.kind === "spell" || action.kind === "ability")) {
    return `${totalChannelPaCost(actor, action, 0)} PA`;
  }
  return `${effectivePaCost(actor, action)} PA`;
}

function truncateRingLabel(name: string, max = 11): string {
  const trimmed = name.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function TokenActionRing({
  x,
  y,
  token,
  allTokens,
  actor,
  combat,
  canBypassTurn,
  roomId,
  onPickMode,
  onClose,
  onRoomSync,
}: Props) {
  const [ringView, setRingView] = useState<RingView>("main");
  const turn = useCombatTurn({ combat, canBypassTurn });

  const weapons = useMemo(
    () => listTokenCombatActions(token, actor, "weapon"),
    [token, actor]
  );
  const spells = useMemo(() => listTokenCombatActions(token, actor, "spell"), [token, actor]);
  const abilities = useMemo(
    () => listTokenCombatActions(token, actor, "ability"),
    [token, actor]
  );

  const turnBlocked =
    Boolean(turn.activeTokenId && turn.activeTokenId !== token.id && !turn.bypassTurn);

  const movePa = useMemo(() => nextHexPaLabel(token), [token]);

  const tokenRingColor = useMemo(() => {
    const playerActorIds = collectPlayerActorIds(allTokens);
    return primaryTokenRingColor(token, playerActorIds);
  }, [token, allTokens]);

  useEffect(() => {
    setRingView("main");
  }, [token.id]);

  const saveLoadout = useCallback(
    async (packId: "armas" | "magias" | "habilidades", entryId: string) => {
      if (!actor || !token.actorId) return;
      await patchRoomActor(roomId, token.actorId, { combatLoadout: { packId, entryId } });
      onRoomSync();
    },
    [actor, token.actorId, roomId, onRoomSync]
  );

  const pickCombatAction = useCallback(
    (mode: "spell" | "ability", action: CombatActionOption) => {
      if (turnBlocked) return;
      if (isActionOnRecharge(token, action, combat?.round ?? 1).blocked) return;
      if (actor) {
        void saveLoadout(mode === "spell" ? "magias" : "habilidades", action.entryId);
      }
      onPickMode(mode, action);
      onClose();
    },
    [turnBlocked, token, combat?.round, actor, saveLoadout, onPickMode, onClose]
  );

  const pickMain = useCallback(
    (mode: TokenActionMode) => {
      if (turnBlocked && mode !== "idle") return;

      if (mode === "spell") {
        if (spells.length === 0) return;
        setRingView("spell");
        return;
      }
      if (mode === "ability") {
        if (abilities.length === 0) return;
        setRingView("ability");
        return;
      }

      let action: CombatActionOption | null = null;
      if (mode === "attack") {
        action = weapons[0] ?? null;
        if (actor && action && action.packId === "armas") {
          void saveLoadout("armas", action.entryId);
        }
      } else if (mode === "idle") {
        action = null;
      } else if (actor) {
        action = resolveCombatAction(actor);
      }

      onPickMode(mode, action);
      onClose();
    },
    [turnBlocked, weapons, spells, abilities, actor, saveLoadout, onPickMode, onClose]
  );

  const combatRound = combat?.round ?? 1;

  const slotForAction = useCallback(
    (
      action: CombatActionOption,
      tone: "spell" | "ability",
      glyph: string,
      pick: () => void
    ): DisplaySlot => {
      const cd = isActionOnRecharge(token, action, combatRound);
      const rechargeTitle = action.recharge?.label;
      return {
        id: `${tone}-${action.entryId}`,
        tone,
        label: truncateRingLabel(action.label || action.name),
        glyph,
        paLabel: combatActionPaLabel(actor, action),
        longLabel: true,
        disabled: turnBlocked || cd.blocked,
        rechargeHint: cd.blocked ? cd.hint : undefined,
        title: [
          action.label || action.name,
          rechargeTitle ? `Recarga: ${rechargeTitle}` : null,
          cd.blocked && cd.hint ? `Disponível: ${cd.hint}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        onClick: pick,
      };
    },
    [token, combatRound, actor, turnBlocked]
  );

  const displaySlots: DisplaySlot[] = useMemo(() => {
    if (ringView === "spell") {
      return spells.map((action) =>
        slotForAction(action, "spell", "✦", () => pickCombatAction("spell", action))
      );
    }

    if (ringView === "ability") {
      return abilities.map((action) =>
        slotForAction(action, "ability", "◆", () => pickCombatAction("ability", action))
      );
    }

    const weapon = weapons[0];
    const spell = spells[0];
    const ability = abilities[0];

    return [
      {
        id: "move-walk",
        tone: "walk",
        label: "Mover",
        glyph: "⌁",
        paLabel: movePa,
        disabled: turnBlocked,
        title: "Próximo hex · caminhada",
        onClick: () => pickMain("move-walk"),
      },
      {
        id: "move-run",
        tone: "run",
        label: "Correr",
        glyph: "»",
        paLabel: movePa,
        disabled: turnBlocked,
        title: "Próximo hex · corrida",
        onClick: () => pickMain("move-run"),
      },
      {
        id: "attack",
        tone: "attack",
        label: "Atacar",
        glyph: "⚔",
        paLabel: combatActionPaLabel(actor, weapon),
        disabled: turnBlocked || weapons.length === 0,
        title: weapon?.label ?? weapon?.name,
        onClick: () => pickMain("attack"),
      },
      {
        id: "spell",
        tone: "spell",
        label: "Magia",
        glyph: "✦",
        paLabel: spells.length > 1 ? `${spells.length}×` : combatActionPaLabel(actor, spell),
        disabled: turnBlocked || spells.length === 0,
        title:
          spells.length > 1
            ? `${spells.length} magias disponíveis`
            : spell?.label ?? spell?.name,
        onClick: () => pickMain("spell"),
      },
      {
        id: "ability",
        tone: "ability",
        label: "Habilidade",
        glyph: "◆",
        paLabel: abilities.length > 1 ? `${abilities.length}×` : combatActionPaLabel(actor, ability),
        disabled: turnBlocked || abilities.length === 0,
        title:
          abilities.length > 1
            ? `${abilities.length} habilidades disponíveis`
            : ability?.label ?? ability?.name,
        onClick: () => pickMain("ability"),
      },
    ];
  }, [
    ringView,
    spells,
    abilities,
    weapons,
    actor,
    movePa,
    turnBlocked,
    pickMain,
    pickCombatAction,
    slotForAction,
    combatRound,
  ]);

  const layout = ringLayout(displaySlots.length);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (ringView !== "main") {
        setRingView("main");
        return;
      }
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ringView, onClose]);

  const slice = (2 * Math.PI) / Math.max(displaySlots.length, 1);
  const ringKey = `${token.id}-${ringView}-${displaySlots.length}`;

  const centerTitle =
    ringView === "main"
      ? "Fechar (Esc)"
      : "Voltar ao menu principal (Esc)";

  return (
    <div
      className="token-action-ring-backdrop"
      role="presentation"
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        className={`token-action-ring${ringView !== "main" ? " token-action-ring--sub" : ""}`}
        style={{ left: x, top: y }}
        role="menu"
        aria-label={
          ringView === "main"
            ? `Ações de ${token.name}`
            : ringView === "spell"
              ? `Magias de ${token.name}`
              : `Habilidades de ${token.name}`
        }
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span
          key={ringKey}
          className="token-action-ring__track"
          style={
            {
              width: layout.track,
              height: layout.track,
              "--tar-track": `${layout.track}px`,
            } as CSSProperties
          }
          aria-hidden
        />

        <button
          type="button"
          className={`token-action-ring__center${
            ringView !== "main" ? " token-action-ring__center--back" : ""
          }`}
          style={{ "--tar-token": tokenRingColor } as CSSProperties}
          onClick={() => {
            if (ringView !== "main") setRingView("main");
            else pickMain("idle");
          }}
          title={centerTitle}
        >
          {ringView === "main" ? (
            <>
              <span className="token-action-ring__center-name">{token.name}</span>
              <span className="token-action-ring__center-hint">{token.pa ?? 0} PA</span>
            </>
          ) : (
            <>
              <span className="token-action-ring__center-glyph" aria-hidden>
                ←
              </span>
              <span className="token-action-ring__center-name">Voltar</span>
              <span className="token-action-ring__center-hint">
                {ringView === "spell" ? "Magias" : "Habilidades"}
              </span>
            </>
          )}
        </button>

        {displaySlots.map((slot, i) => {
          const angle = slice * i - Math.PI / 2;
          const left = Math.cos(angle) * layout.radius;
          const top = Math.sin(angle) * layout.radius;
          return (
            <button
              key={`${ringKey}-${slot.id}`}
              type="button"
              role="menuitem"
              className={`token-action-ring__slot token-action-ring__slot--${slot.tone}${
                slot.rechargeHint ? " token-action-ring__slot--cooldown" : ""
              }`}
              style={
                {
                  "--tar-i": i,
                  "--tar-x": `${left}px`,
                  "--tar-y": `${top}px`,
                  "--tar-slot-scale": layout.slotScale,
                  transform: `translate(calc(-50% + ${left}px), calc(-50% + ${top}px)) scale(${layout.slotScale})`,
                } as CSSProperties
              }
              disabled={slot.disabled}
              title={
                slot.title
                  ? `${slot.title} · ${slot.paLabel}`
                  : `${slot.label} · ${slot.paLabel}`
              }
              onClick={slot.onClick}
            >
              <span className="token-action-ring__glyph" aria-hidden>
                {slot.glyph}
              </span>
              <span
                className={`token-action-ring__label${
                  slot.longLabel ? " token-action-ring__label--long" : ""
                }`}
              >
                {slot.label}
              </span>
              <span className="token-action-ring__pa">{slot.paLabel}</span>
              {slot.rechargeHint ? (
                <span className="token-action-ring__cd" title={`Recarga · ${slot.rechargeHint}`}>
                  <span className="token-action-ring__cd-icon" aria-hidden>
                    ⏳
                  </span>
                  {slot.rechargeHint}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
