"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  IconAbility,
  IconChevronLeft,
  IconFlask,
  IconHeart,
  IconHourglass,
  IconMenu,
  IconMove,
  IconRun,
  IconSheet,
  IconSpell,
  IconSword,
} from "@/components/ui/EldarinIcons";
import {
  consumablePaCost,
  listActorConsumables,
  type ActorConsumable,
} from "@/lib/combat/consumables";
import { consumeRoomItem, patchRoomActor } from "@/hooks/useRoomSync";
import type { RoomSnapshot } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";
import type { RoomActor } from "@/lib/room/types";
import type { CombatTrack } from "@/lib/room/combat";
import type { CombatActionOption } from "@/lib/combat/types";
import {
  listTokenCombatActions,
  resolveCombatAction,
} from "@/lib/combat/attack";
import {
  effectiveMovementPaCost,
  effectivePaCost,
  paCostContextFromToken,
  paTurnRulesForActor,
  totalAttackPaCost,
} from "@/lib/combat/pa-economy";
import { isActionOnRecharge } from "@/lib/combat/recharge";
import { totalChannelPaCost } from "@/lib/combat/spell-channel";
import type { TokenActionMode } from "@/lib/vtt/action-mode";
import { movementPaCost, movementPaBandsForToken } from "@/lib/vtt/movement-pa";
import { useCombatTurn } from "@/hooks/useCombatActions";
import { formatCombatActionTooltip } from "@/lib/combat/action-tooltip";
import { collectPlayerActorIds, primaryTokenRingColor } from "@/lib/vtt/token-colors";
import { CombatActionDetail } from "@/components/vtt/CombatActionDetail";
import { computeCursorDetailPlacement } from "@/lib/vtt/cursor-detail-placement";
import "./token-action-ring.css";

type SlotTone =
  | "walk"
  | "run"
  | "attack"
  | "spell"
  | "ability"
  | "consumable"
  | "sheet"
  | "bestiary"
  | "hp";
type RingView = "main" | "spell" | "ability" | "consumable";

type DisplaySlot = {
  id: string;
  tone: SlotTone;
  label: string;
  glyph: ReactNode;
  paLabel: string;
  disabled?: boolean;
  title?: string;
  longLabel?: boolean;
  rechargeHint?: string;
  action?: CombatActionOption | null;
  detailHint?: string;
  consumable?: ActorConsumable | null;
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
  onRoomSync: (payload?: import("@/hooks/useRoomSync").RoomApiPayload) => void;
  showTokenSheet?: boolean;
  onOpenTokenSheet?: () => void;
  showPlayerBestiary?: boolean;
  onOpenPlayerBestiary?: () => void;
  /** Mestre: ajustar vida do token (personagem ou monstro). */
  showGmHpEdit?: boolean;
  onOpenGmHpEdit?: () => void;
  /** Abre seletor de magias estilo fantasia clássica (em vez do submenu radial). */
  onOpenSpellPicker?: () => void;
};

const RING_RADIUS_BASE = 152;
/** Duração da animação de saída (sincronizar com CSS). */
const TAR_RING_EXIT_MS = 320;
/** Atraso + duração do último slot em `tar-slot-radial-in` (+ folga). */
function tarIntroMs(slotCount: number): number {
  const lastDelay = 0.1 + Math.max(0, slotCount - 1) * 0.038;
  return Math.ceil((lastDelay + 0.34) * 1000) + 32;
}

function ringLayout(slotCount: number): { radius: number; track: number; slotScale: number } {
  if (slotCount <= 5) {
    return { radius: RING_RADIUS_BASE, track: 312, slotScale: 1 };
  }
  if (slotCount <= 8) {
    return { radius: Math.round(RING_RADIUS_BASE * 1.16), track: 360, slotScale: 1.04 };
  }
  return { radius: Math.round(RING_RADIUS_BASE * 1.32), track: 408, slotScale: 1.08 };
}

/** Posição final de cada slot ao longo de um raio a partir do centro do token. */
function slotRadialPosition(angle: number, radius: number) {
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function nextCellPaLabel(token: BattleToken, actor: RoomActor | null): string {
  const bands = movementPaBandsForToken(token);
  const spent = token.movementSpentCells ?? 0;
  const raw = movementPaCost(spent, 1, bands);
  const freeBasic = actor ? paTurnRulesForActor(actor).freeBasicMovePa : false;
  const cost = effectiveMovementPaCost(token, raw, freeBasic);
  return cost === 0 ? "0 PA" : `${cost} PA`;
}

function combatActionPaLabel(
  token: BattleToken,
  actor: RoomActor | null,
  action: CombatActionOption | undefined
): string {
  if (!action) return "—";
  if (action.channelMaxExtraPa) {
    const base = totalChannelPaCost(actor, action, 0, token);
    return `${base}+ PA`;
  }
  if (actor && action.kind === "weapon") {
    const total = totalAttackPaCost(actor, action, token);
    return `${total} PA`;
  }
  if (actor && (action.kind === "spell" || action.kind === "ability")) {
    return `${totalChannelPaCost(actor, action, 0, token)} PA`;
  }
  return `${effectivePaCost(actor, action, paCostContextFromToken(token))} PA`;
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
  showTokenSheet = false,
  onOpenTokenSheet,
  showPlayerBestiary = false,
  onOpenPlayerBestiary,
  showGmHpEdit = false,
  onOpenGmHpEdit,
  onOpenSpellPicker,
}: Props) {
  const [ringView, setRingView] = useState<RingView>("main");
  const [exiting, setExiting] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [viewSwap, setViewSwap] = useState(false);
  const [backdropReady, setBackdropReady] = useState(false);
  const exitingRef = useRef(false);
  const ringViewRef = useRef(ringView);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredInfoSlotId, setHoveredInfoSlotId] = useState<string | null>(null);
  const [pinnedInfoSlotId, setPinnedInfoSlotId] = useState<string | null>(null);
  const [infoPointer, setInfoPointer] = useState<{ x: number; y: number } | null>(null);
  const turn = useCombatTurn({ combat, canBypassTurn, tokens: allTokens });

  const weapons = useMemo(
    () => listTokenCombatActions(token, actor, "weapon"),
    [token, actor]
  );
  const spells = useMemo(() => listTokenCombatActions(token, actor, "spell"), [token, actor]);
  const abilities = useMemo(
    () => listTokenCombatActions(token, actor, "ability"),
    [token, actor]
  );
  const consumables = useMemo(
    () => (actor ? listActorConsumables(actor) : []),
    [actor]
  );

  const turnBlocked = turn.isTurnBlockedForToken(token);
  const consumablePa = consumablePaCost();

  const movePa = useMemo(() => nextCellPaLabel(token, actor), [token, actor]);

  const tokenRingColor = useMemo(() => {
    const playerActorIds = collectPlayerActorIds(allTokens);
    return primaryTokenRingColor(token, playerActorIds);
  }, [token, allTokens]);

  const beginClose = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(true);
    exitTimerRef.current = setTimeout(() => {
      onClose();
    }, TAR_RING_EXIT_MS);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
    };
  }, []);

  // Pequeno delay para evitar que o click que abre o ring feche o backdrop imediatamente.
  useEffect(() => {
    const t = setTimeout(() => setBackdropReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setRingView("main");
    setHoveredInfoSlotId(null);
    setInfoPointer(null);
    setPinnedInfoSlotId(null);
    exitingRef.current = false;
    setExiting(false);
    setIntroDone(false);
  }, [token.id]);

  useEffect(() => {
    setHoveredInfoSlotId(null);
    setPinnedInfoSlotId(null);
    setInfoPointer(null);
  }, [ringView]);

  const saveLoadout = useCallback(
    async (packId: "armas" | "magias" | "habilidades", entryId: string) => {
      if (!actor || !token.actorId) return;
      try {
        await patchRoomActor(roomId, token.actorId, { combatLoadout: { packId, entryId } });
        onRoomSync();
      } catch {
        /* loadout opcional — ataque envia actionEntryId na requisição */
      }
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
      beginClose();
    },
    [turnBlocked, token, combat?.round, actor, saveLoadout, onPickMode, beginClose]
  );

  const resolveRingAttackAction = useCallback((): CombatActionOption | null => {
    if (!actor) return weapons[0] ?? null;
    try {
      const resolved = resolveCombatAction(actor);
      if (resolved.kind === "weapon" || resolved.kind === "unarmed") return resolved;
    } catch {
      /* loadout inválido ou apontando para magia/habilidade */
    }
    return weapons[0] ?? null;
  }, [actor, weapons]);

  const pickMain = useCallback(
    (mode: TokenActionMode) => {
      if (turnBlocked && mode !== "idle") return;

      if (mode === "spell") {
        if (spells.length === 0) return;
        if (spells.length === 1) {
          pickCombatAction("spell", spells[0]!);
          return;
        }
        onOpenSpellPicker?.();
        beginClose();
        return;
      }
      if (mode === "ability") {
        if (abilities.length === 0) return;
        setRingView("ability");
        return;
      }

      let action: CombatActionOption | null = null;
      if (mode === "attack") {
        action = resolveRingAttackAction();
        if (actor && action && action.packId !== "unarmed") {
          void saveLoadout(action.packId as "armas", action.entryId);
        }
      } else if (mode === "idle") {
        action = null;
      } else if (actor) {
        try {
          action = resolveCombatAction(actor);
        } catch {
          action = null;
        }
      }

      onPickMode(mode, action);
      beginClose();
    },
    [
      turnBlocked,
      spells,
      abilities,
      actor,
      onPickMode,
      beginClose,
      onOpenSpellPicker,
      pickCombatAction,
      resolveRingAttackAction,
      saveLoadout,
    ]
  );

  const openConsumableSubmenu = useCallback(() => {
    if (consumables.length === 0) return;
    setRingView("consumable");
  }, [consumables.length]);

  const [consumeBusy, setConsumeBusy] = useState(false);

  const drinkConsumable = useCallback(
    async (item: ActorConsumable) => {
      if (turnBlocked || consumeBusy) return;
      setConsumeBusy(true);
      try {
        const snap = await consumeRoomItem(roomId, token.id, item.instanceId, {
          bypassTurn: canBypassTurn,
        });
        onRoomSync(snap);
        beginClose();
      } catch {
        onRoomSync();
      } finally {
        setConsumeBusy(false);
      }
    },
    [turnBlocked, consumeBusy, roomId, token.id, canBypassTurn, onRoomSync, beginClose]
  );

  const combatRound = combat?.round ?? 1;

  const slotForAction = useCallback(
    (
      action: CombatActionOption,
      tone: "spell" | "ability",
      glyph: ReactNode,
      pick: () => void
    ): DisplaySlot => {
      const cd = isActionOnRecharge(token, action, combatRound);
      const rechargeTitle = action.recharge?.label;
      return {
        id: `${tone}-${action.entryId}`,
        tone,
        label: truncateRingLabel(action.label || action.name),
        glyph,
        paLabel: combatActionPaLabel(token, actor, action),
        longLabel: true,
        disabled: turnBlocked || cd.blocked,
        rechargeHint: cd.blocked ? cd.hint : undefined,
        title: [
          formatCombatActionTooltip(action, actor, token),
          rechargeTitle ? `Recarga: ${rechargeTitle}` : null,
          cd.blocked && cd.hint ? `Disponível: ${cd.hint}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        action,
        onClick: pick,
      };
    },
    [token, combatRound, actor, turnBlocked]
  );

  const displaySlots: DisplaySlot[] = useMemo(() => {
    if (ringView === "spell") {
      return spells.map((action) =>
        slotForAction(action, "spell", <IconSpell size={16} />, () => pickCombatAction("spell", action))
      );
    }

    if (ringView === "ability") {
      return abilities.map((action) =>
        slotForAction(action, "ability", <IconAbility size={16} />, () => pickCombatAction("ability", action))
      );
    }

    if (ringView === "consumable") {
      return consumables.map((item) => ({
        id: `poc-${item.instanceId}`,
        tone: "consumable" as const,
        label: truncateRingLabel(item.name, 14),
        glyph: <IconFlask size={16} />,
        paLabel: `${consumablePa} PA`,
        longLabel: true,
        disabled: turnBlocked || consumeBusy,
        title: `${item.name} ×${item.quantity}\n${item.description}`,
        detailHint: item.healFormula
          ? `Cura ${item.healFormula} · ${item.quantity} no inventário`
          : item.effectHint
            ? `${item.effectHint} · ×${item.quantity}`
            : `${item.quantity} no inventário`,
        consumable: item,
        onClick: () => void drinkConsumable(item),
      }));
    }

    const weapon = actor
      ? (() => {
          try {
            const resolved = resolveCombatAction(actor);
            if (resolved.kind === "weapon" || resolved.kind === "unarmed") return resolved;
          } catch {
            /* loadout inválido — cai no primeiro arma */
          }
          return weapons[0] ?? null;
        })()
      : (weapons[0] ?? null);
    const spell = spells[0];
    const ability = abilities[0];

    const slots: DisplaySlot[] = [
      {
        id: "move-walk",
        tone: "walk",
        label: "Mover",
        glyph: <IconMove size={16} />,
        paLabel: movePa,
        disabled: turnBlocked,
        title: "Próxima célula · caminhada",
        detailHint: "Caminhada — próxima célula na faixa gratuita ou com PA conforme distância já percorrida.",
        onClick: () => pickMain("move-walk"),
      },
      {
        id: "move-run",
        tone: "run",
        label: "Correr",
        glyph: <IconRun size={16} />,
        paLabel: movePa,
        disabled: turnBlocked,
        title: "Próxima célula · corrida",
        detailHint: "Corrida — deslocamento extra com custo de PA maior que a caminhada.",
        onClick: () => pickMain("move-run"),
      },
      {
        id: "attack",
        tone: "attack",
        label: "Atacar",
        glyph: <IconSword size={16} />,
        paLabel: combatActionPaLabel(token, actor, weapon),
        disabled: turnBlocked || weapons.length === 0,
        title: weapon ? formatCombatActionTooltip(weapon, actor, token) : undefined,
        action: weapon ?? null,
        onClick: () => pickMain("attack"),
      },
      {
        id: "spell",
        tone: "spell",
        label: "Magia",
        glyph: <IconSpell size={16} />,
        paLabel: spells.length > 1 ? `${spells.length}×` : combatActionPaLabel(token, actor, spell),
        disabled: turnBlocked || spells.length === 0,
        title:
          spells.length > 1
            ? `${spells.length} magias disponíveis — abra o submenu`
            : spell
              ? formatCombatActionTooltip(spell, actor, token)
              : undefined,
        action: spells.length === 1 ? spell ?? null : null,
        detailHint:
          spells.length > 1
            ? `${spells.length} magias — clique para abrir a lista e passe o mouse para ver cada descrição.`
            : undefined,
        onClick: () => pickMain("spell"),
      },
      {
        id: "ability",
        tone: "ability",
        label: "Habilidade",
        glyph: <IconAbility size={16} />,
        paLabel: abilities.length > 1 ? `${abilities.length}×` : combatActionPaLabel(token, actor, ability),
        disabled: turnBlocked || abilities.length === 0,
        title:
          abilities.length > 1
            ? `${abilities.length} habilidades disponíveis — abra o submenu`
            : ability
              ? formatCombatActionTooltip(ability, actor, token)
              : undefined,
        action: abilities.length === 1 ? ability ?? null : null,
        detailHint:
          abilities.length > 1
            ? `${abilities.length} habilidades — clique para abrir a lista e passe o mouse para ver cada descrição.`
            : undefined,
        onClick: () => pickMain("ability"),
      },
      {
        id: "consumable",
        tone: "consumable",
        label: "Consumível",
        glyph: <IconFlask size={16} />,
        paLabel:
          consumables.length > 1
            ? `${consumables.length}×`
            : consumables.length === 1
              ? `${consumablePa} PA`
              : "—",
        disabled: turnBlocked || consumables.length === 0,
        title:
          consumables.length === 0
            ? "Sem poções no inventário"
            : consumables.length > 1
              ? `${consumables.length} poções — abra o submenu`
              : `${consumables[0]?.name} ×${consumables[0]?.quantity}`,
        detailHint:
          consumables.length === 0
            ? "Adicione poções (POC) ao inventário da ficha."
            : consumables.length > 1
              ? "Poções do inventário — clique para escolher."
              : consumables[0]?.healFormula
                ? `Cura ${consumables[0].healFormula}`
                : consumables[0]?.effectHint ?? consumables[0]?.description,
        consumable: consumables.length === 1 ? consumables[0] : null,
        onClick: () => {
          if (consumables.length === 1) {
            void drinkConsumable(consumables[0]!);
            return;
          }
          openConsumableSubmenu();
        },
      },
    ];

    if (showTokenSheet && onOpenTokenSheet) {
      slots.push({
        id: "sheet",
        tone: "sheet",
        label: "Ficha",
        glyph: <IconSheet size={16} />,
        paLabel: "—",
        title: "Abrir ficha deste token",
        onClick: () => {
          onOpenTokenSheet();
          beginClose();
        },
      });
    }

    if (showPlayerBestiary && onOpenPlayerBestiary) {
      slots.push({
        id: "bestiary",
        tone: "bestiary",
        label: "Bestiário",
        glyph: <IconMenu size={16} />,
        paLabel: "—",
        title: "Bestiário individual do jogador (visão do mestre)",
        onClick: () => {
          onOpenPlayerBestiary();
          beginClose();
        },
      });
    }

    if (showGmHpEdit && onOpenGmHpEdit && token.vidaMax != null) {
      const temp = token.vidaTemp ?? 0;
      const hpNow = token.vida ?? 0;
      slots.push({
        id: "hp",
        tone: "hp",
        label: "Vida",
        glyph: <IconHeart size={16} />,
        paLabel: temp > 0 ? `${hpNow}/${token.vidaMax} +${temp}` : `${hpNow}/${token.vidaMax}`,
        title: "Ajustar vida atual, máxima e temporária",
        onClick: () => {
          onOpenGmHpEdit();
          beginClose();
        },
      });
    }

    return slots;
  }, [
    ringView,
    spells,
    abilities,
    consumables,
    consumablePa,
    consumeBusy,
    drinkConsumable,
    openConsumableSubmenu,
    weapons,
    actor,
    movePa,
    turnBlocked,
    pickMain,
    pickCombatAction,
    slotForAction,
    combatRound,
    showTokenSheet,
    onOpenTokenSheet,
    showPlayerBestiary,
    onOpenPlayerBestiary,
    showGmHpEdit,
    onOpenGmHpEdit,
    token.vida,
    token.vidaMax,
    token.vidaTemp,
    beginClose,
  ]);

  const layout = ringLayout(displaySlots.length);

  const activeDetailSlotId = pinnedInfoSlotId ?? hoveredInfoSlotId;

  const activeDetailSlot = useMemo(
    () => displaySlots.find((s) => s.id === activeDetailSlotId) ?? null,
    [displaySlots, activeDetailSlotId]
  );

  const detailPlacement = useMemo(
    () => (infoPointer ? computeCursorDetailPlacement(infoPointer) : null),
    [infoPointer]
  );

  const syncInfoPointer = useCallback((e: MouseEvent | FocusEvent<HTMLButtonElement>) => {
    if ("clientX" in e && e.clientX > 0) {
      setInfoPointer({ x: e.clientX, y: e.clientY });
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setInfoPointer({ x: rect.right, y: rect.top + rect.height / 2 });
  }, []);

  const toggleInfoPin = useCallback((slotId: string, e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    syncInfoPointer(e);
    setPinnedInfoSlotId((prev) => (prev === slotId ? null : slotId));
    setHoveredInfoSlotId(slotId);
  }, [syncInfoPointer]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (ringView !== "main") {
        setRingView("main");
        return;
      }
      beginClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ringView, beginClose]);

  const slice = (2 * Math.PI) / Math.max(displaySlots.length, 1);
  const slotsKey = `${ringView}-${displaySlots.map((s) => s.id).join("|")}`;

  useEffect(() => {
    setIntroDone(false);
    setViewSwap(false);
    ringViewRef.current = "main";
    if (introTimerRef.current) clearTimeout(introTimerRef.current);
    const ms = tarIntroMs(displaySlots.length);
    introTimerRef.current = setTimeout(() => {
      setIntroDone(true);
    }, ms);
    return () => {
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
    };
  }, [token.id]);

  useEffect(() => {
    if (ringViewRef.current === ringView) return;
    ringViewRef.current = ringView;
    if (!introDone) return;
    setViewSwap(true);
    const t = setTimeout(() => setViewSwap(false), 260);
    return () => clearTimeout(t);
  }, [ringView, introDone]);

  const centerTitle =
    ringView === "main"
      ? "Fechar (Esc)"
      : "Voltar ao menu principal (Esc)";

  return (
    <div
      className={`token-action-ring-backdrop${exiting ? " token-action-ring-backdrop--exiting" : ""}`}
      role="presentation"
      onClick={backdropReady ? beginClose : undefined}
      onContextMenu={(e) => {
        e.preventDefault();
        if (backdropReady) beginClose();
      }}
    >
      <div
        className={`token-action-ring${ringView !== "main" ? " token-action-ring--sub" : ""}${
          introDone ? " token-action-ring--settled" : ""
        }${viewSwap ? " token-action-ring--swap" : ""}${
          exiting ? " token-action-ring--exiting" : ""
        }`}
        style={{ left: x, top: y, "--tar-token": tokenRingColor } as CSSProperties}
        role="menu"
        aria-label={
          ringView === "main"
            ? `Ações de ${token.name}`
            : ringView === "spell"
              ? `Magias de ${token.name}`
              : ringView === "ability"
                ? `Habilidades de ${token.name}`
                : `Consumíveis de ${token.name}`
        }
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span
          className="token-action-ring__track"
          style={
            {
              width: layout.track,
              height: layout.track,
              "--tar-track": `${layout.track}px`,
              "--tar-spoke-count": displaySlots.length,
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
                <IconChevronLeft size={18} />
              </span>
              <span className="token-action-ring__center-name">Voltar</span>
              <span className="token-action-ring__center-hint">
                {ringView === "spell"
                  ? "Magias"
                  : ringView === "ability"
                    ? "Habilidades"
                    : "Consumíveis"}
              </span>
            </>
          )}
        </button>

        {displaySlots.map((slot, i) => {
          const angle = slice * i - Math.PI / 2;
          const pos = slotRadialPosition(angle, layout.radius);
          const slotStyle = {
            "--tar-i": i,
            "--tar-x": `${pos.x}px`,
            "--tar-y": `${pos.y}px`,
            "--tar-slot-scale": layout.slotScale,
            "--tar-slot-count": displaySlots.length,
          } as CSSProperties;
          const showInfo =
            (slot.action || slot.detailHint || slot.consumable) && !slot.disabled;
          return (
            <div
              key={`${slotsKey}-${slot.id}`}
              className="token-action-ring__slot-wrap"
              style={slotStyle}
            >
              <button
                type="button"
                role="menuitem"
                className={`token-action-ring__slot token-action-ring__slot--${slot.tone}${
                  slot.rechargeHint ? " token-action-ring__slot--cooldown" : ""
                }`}
                disabled={slot.disabled}
                title={`${slot.label} · ${slot.paLabel}`}
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
                      <IconHourglass size={10} />
                    </span>
                    {slot.rechargeHint}
                  </span>
                ) : null}
              </button>
              {showInfo ? (
                <button
                  type="button"
                  className={`token-action-ring__info${
                    pinnedInfoSlotId === slot.id || hoveredInfoSlotId === slot.id
                      ? " token-action-ring__info--on"
                      : ""
                  }`}
                  aria-label={`Informações: ${slot.label}`}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseEnter={(e) => {
                    syncInfoPointer(e);
                    setHoveredInfoSlotId(slot.id);
                  }}
                  onMouseMove={(e) => {
                    if (hoveredInfoSlotId === slot.id || pinnedInfoSlotId === slot.id) {
                      syncInfoPointer(e);
                    }
                  }}
                  onMouseLeave={() => {
                    if (pinnedInfoSlotId !== slot.id) {
                      setHoveredInfoSlotId(null);
                      setInfoPointer(null);
                    }
                  }}
                  onFocus={(e) => {
                    syncInfoPointer(e);
                    setHoveredInfoSlotId(slot.id);
                  }}
                  onBlur={() => {
                    if (pinnedInfoSlotId !== slot.id) {
                      setHoveredInfoSlotId(null);
                      setInfoPointer(null);
                    }
                  }}
                  onClick={(e) => toggleInfoPin(slot.id, e)}
                >
                  i
                </button>
              ) : null}
            </div>
          );
        })}

      </div>

      {activeDetailSlot && detailPlacement ? (
        activeDetailSlot.action ? (
          <div
            className={`token-action-ring__detail token-action-ring__detail--cursor${
              detailPlacement.flipLeft ? " token-action-ring__detail--cursor-left" : ""
            }`}
            style={
              {
                left: detailPlacement.left,
                top: detailPlacement.top,
              } as CSSProperties
            }
            onClick={(e) => e.stopPropagation()}
          >
            <CombatActionDetail
              action={activeDetailSlot.action}
              actor={actor}
              className="combat-action-detail--ring"
            />
          </div>
        ) : activeDetailSlot.consumable ? (
          <div
            className={`token-action-ring__detail token-action-ring__detail--hint token-action-ring__detail--cursor${
              detailPlacement.flipLeft ? " token-action-ring__detail--cursor-left" : ""
            }`}
            style={
              {
                left: detailPlacement.left,
                top: detailPlacement.top,
              } as CSSProperties
            }
            onClick={(e) => e.stopPropagation()}
          >
            <p className="token-action-ring__detail-hint">
              <strong>{activeDetailSlot.consumable.name}</strong>
              <br />
              ×{activeDetailSlot.consumable.quantity} · {consumablePa} PA
              {activeDetailSlot.consumable.healFormula ? (
                <>
                  <br />
                  Cura {activeDetailSlot.consumable.healFormula}
                </>
              ) : activeDetailSlot.consumable.effectHint ? (
                <>
                  <br />
                  {activeDetailSlot.consumable.effectHint}
                </>
              ) : null}
              <br />
              {activeDetailSlot.consumable.description}
            </p>
          </div>
        ) : activeDetailSlot.detailHint ? (
          <div
            className={`token-action-ring__detail token-action-ring__detail--hint token-action-ring__detail--cursor${
              detailPlacement.flipLeft ? " token-action-ring__detail--cursor-left" : ""
            }`}
            style={
              {
                left: detailPlacement.left,
                top: detailPlacement.top,
              } as CSSProperties
            }
            onClick={(e) => e.stopPropagation()}
          >
            <p className="token-action-ring__detail-hint">{activeDetailSlot.detailHint}</p>
          </div>
        ) : null
      ) : null}
    </div>
  );
}
