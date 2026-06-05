"use client";

import { useCallback, useEffect, useMemo, type CSSProperties } from "react";
import type { BattleToken } from "@/lib/vtt/types";
import type { RoomActor } from "@/lib/room/types";
import type { CombatTrack } from "@/lib/room/combat";
import type { CombatActionOption } from "@/lib/combat/types";
import {
  listTokenCombatActions,
  resolveCombatAction,
} from "@/lib/combat/attack";
import { effectivePaCost, totalAttackPaCost } from "@/lib/combat/pa-economy";
import { ACTION_MODE_LABEL, type TokenActionMode } from "@/lib/vtt/action-mode";
import { movementPaCost, movementPaBandsForToken } from "@/lib/vtt/movement-pa";
import { useCombatTurn } from "@/hooks/useCombatActions";
import { patchRoomActor } from "@/hooks/useRoomSync";
import "./token-action-ring.css";

type SlotTone = "walk" | "run" | "attack" | "spell" | "ability";

type RingSlot = {
  id: string;
  mode: TokenActionMode;
  tone: SlotTone;
  label: string;
  glyph: string;
  paLabel: string;
  disabled?: boolean;
  title?: string;
};

type Props = {
  x: number;
  y: number;
  token: BattleToken;
  actor: RoomActor | null;
  combat: CombatTrack | null | undefined;
  canBypassTurn: boolean;
  roomId: string;
  onPickMode: (mode: TokenActionMode, action: CombatActionOption | null) => void;
  onClose: () => void;
  onRoomSync: () => void;
};

const RING_RADIUS = 123;

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
  return `${effectivePaCost(actor, action)} PA`;
}

export function TokenActionRing({
  x,
  y,
  token,
  actor,
  combat,
  canBypassTurn,
  roomId,
  onPickMode,
  onClose,
  onRoomSync,
}: Props) {
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

  const slots: RingSlot[] = useMemo(() => {
    const weapon = weapons[0];
    const spell = spells[0];
    const ability = abilities[0];

    return [
      {
        id: "move-walk",
        mode: "move-walk",
        tone: "walk",
        label: "Mover",
        glyph: "👣",
        paLabel: movePa,
        disabled: turnBlocked,
        title: "Próximo hex · caminhada",
      },
      {
        id: "move-run",
        mode: "move-run",
        tone: "run",
        label: "Correr",
        glyph: "💨",
        paLabel: movePa,
        disabled: turnBlocked,
        title: "Próximo hex · corrida",
      },
      {
        id: "attack",
        mode: "attack",
        tone: "attack",
        label: "Atacar",
        glyph: "⚔",
        paLabel: combatActionPaLabel(actor, weapon),
        disabled: turnBlocked || weapons.length === 0,
        title: weapon?.label ?? weapon?.name,
      },
      {
        id: "spell",
        mode: "spell",
        tone: "spell",
        label: "Magia",
        glyph: "✦",
        paLabel: combatActionPaLabel(actor, spell),
        disabled: turnBlocked || spells.length === 0,
        title: spell?.label ?? spell?.name,
      },
      {
        id: "ability",
        mode: "ability",
        tone: "ability",
        label: "Habilidade",
        glyph: "◆",
        paLabel: combatActionPaLabel(actor, ability),
        disabled: turnBlocked || abilities.length === 0,
        title: ability?.label ?? ability?.name,
      },
      {
        id: "idle",
        mode: "idle",
        tone: "walk",
        label: "Cancelar",
        glyph: "✕",
        paLabel: "",
      },
    ];
  }, [turnBlocked, weapons, spells, abilities, actor, movePa]);

  const saveLoadout = useCallback(
    async (packId: "armas" | "magias" | "habilidades", entryId: string) => {
      if (!actor || !token.actorId) return;
      await patchRoomActor(roomId, token.actorId, { combatLoadout: { packId, entryId } });
      onRoomSync();
    },
    [actor, token.actorId, roomId, onRoomSync]
  );

  const pick = useCallback(
    (mode: TokenActionMode) => {
      if (turnBlocked && mode !== "idle") return;

      let action: CombatActionOption | null = null;
      if (mode === "attack") {
        action = weapons[0] ?? null;
        if (actor && action && action.packId === "armas") {
          void saveLoadout("armas", action.entryId);
        }
      } else if (mode === "spell") {
        action = spells[0] ?? null;
        if (actor && action) void saveLoadout("magias", action.entryId);
      } else if (mode === "ability") {
        action = abilities[0] ?? null;
        if (actor && action) void saveLoadout("habilidades", action.entryId);
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const visibleSlots = slots.filter((s) => s.mode !== "idle");
  const slice = (2 * Math.PI) / visibleSlots.length;

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
        className="token-action-ring"
        style={{ left: x, top: y }}
        role="menu"
        aria-label={`Ações de ${token.name}`}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="token-action-ring__track" aria-hidden />

        <button
          type="button"
          className="token-action-ring__center"
          onClick={() => pick("idle")}
          title="Fechar (Esc)"
        >
          <span className="token-action-ring__center-name">{token.name}</span>
          <span className="token-action-ring__center-hint">{token.pa ?? 0} PA</span>
        </button>

        {visibleSlots.map((slot, i) => {
          const angle = slice * i - Math.PI / 2;
          const left = Math.cos(angle) * RING_RADIUS;
          const top = Math.sin(angle) * RING_RADIUS;
          return (
            <button
              key={slot.id}
              type="button"
              role="menuitem"
              className={`token-action-ring__slot token-action-ring__slot--${slot.tone}`}
              style={
                {
                  "--tar-i": i,
                  "--tar-x": `${left}px`,
                  "--tar-y": `${top}px`,
                  transform: `translate(calc(-50% + ${left}px), calc(-50% + ${top}px))`,
                } as CSSProperties
              }
              disabled={slot.disabled}
              title={
                slot.title
                  ? `${slot.title} · ${slot.paLabel}`
                  : `${ACTION_MODE_LABEL[slot.mode]} · ${slot.paLabel}`
              }
              onClick={() => pick(slot.mode)}
            >
              <span className="token-action-ring__glyph" aria-hidden>
                {slot.glyph}
              </span>
              <span className="token-action-ring__label">{slot.label}</span>
              <span className="token-action-ring__pa">{slot.paLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
