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
import { ACTION_MODE_LABEL, type TokenActionMode } from "@/lib/vtt/action-mode";
import { useCombatTurn } from "@/hooks/useCombatActions";
import { patchRoomActor } from "@/hooks/useRoomSync";
import "./token-action-ring.css";

type RingSlot = {
  id: string;
  mode: TokenActionMode;
  label: string;
  glyph: string;
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

const RING_RADIUS = 82;

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

  const slots: RingSlot[] = useMemo(() => {
    const list: RingSlot[] = [
      {
        id: "move-walk",
        mode: "move-walk",
        label: "Mover",
        glyph: "👣",
        disabled: turnBlocked,
      },
      {
        id: "move-run",
        mode: "move-run",
        label: "Correr",
        glyph: "💨",
        disabled: turnBlocked,
      },
      {
        id: "attack",
        mode: "attack",
        label: "Atacar",
        glyph: "⚔",
        disabled: turnBlocked || weapons.length === 0,
        title: weapons[0]?.label,
      },
      {
        id: "spell",
        mode: "spell",
        label: "Magia",
        glyph: "✦",
        disabled: turnBlocked || spells.length === 0,
        title: spells[0]?.label,
      },
      {
        id: "ability",
        mode: "ability",
        label: "Habilidade",
        glyph: "◆",
        disabled: turnBlocked || abilities.length === 0,
        title: abilities[0]?.label,
      },
      {
        id: "idle",
        mode: "idle",
        label: "Cancelar",
        glyph: "✕",
      },
    ];
    return list;
  }, [turnBlocked, weapons, spells, abilities]);

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
          <span className="token-action-ring__center-hint">PA {token.pa ?? 0}</span>
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
              className="token-action-ring__slot"
              style={
                {
                  "--tar-i": i,
                  "--tar-x": `${left}px`,
                  "--tar-y": `${top}px`,
                  transform: `translate(calc(-50% + ${left}px), calc(-50% + ${top}px))`,
                } as CSSProperties
              }
              disabled={slot.disabled}
              title={slot.title ?? ACTION_MODE_LABEL[slot.mode]}
              onClick={() => pick(slot.mode)}
            >
              <span className="token-action-ring__glyph" aria-hidden>
                {slot.glyph}
              </span>
              <span className="token-action-ring__label">{slot.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
