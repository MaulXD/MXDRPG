"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Axial } from "@/lib/vtt/hex-math";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";
import {
  moveRoomTokenBudget,
  postRoomAttack,
  postRoomAbility,
  postRoomAreaSpell,
  postRoomPing,
  revealRoomHex,
  repositionRoomToken,
} from "@/hooks/useRoomSync";
import { filterTokensForFog, visibleHexSetForPlayer } from "@/lib/vtt/fog-of-war";
import { ActiveCharactersPanel } from "@/components/vtt/ActiveCharactersPanel";
import { GmMenuPanel } from "@/components/vtt/GmMenuPanel";
import type { RoomSnapshot } from "@/lib/room/types";
import { TokenActionRing } from "@/components/vtt/TokenActionRing";
import { SpellChannelControl } from "@/components/vtt/SpellChannelControl";
import { MonsterSpawnPanel } from "@/components/vtt/MonsterSpawnPanel";
import { BattlefieldViewControls } from "@/components/vtt/BattlefieldViewControls";
import { MesaDockPanel } from "@/components/vtt/MesaDockPanel";
import { FoundryWindow } from "@/components/vtt/foundry/FoundryWindow";
import type { FoundryWindowLayout } from "@/hooks/vtt/useFoundryWindows";
import type { MesaPanelLayout } from "@/lib/vtt/mesa-panel-layout";
import { effectiveMesaPanelWidth } from "@/lib/vtt/mesa-panel-layout";
import {
  CombatFxLayer,
  combatFxFromMessage,
  type CombatFxState,
  type TokenCombatFlash,
} from "@/components/vtt/CombatFxLayer";
import type { ChatMessage } from "@/lib/room/chat";
import { activeTokenId } from "@/lib/room/combat";
import {
  listTokenCombatActions,
  resolveCombatAction,
} from "@/lib/combat/attack";
import type { CombatActionOption } from "@/lib/combat/types";
import { isMoveMode, isTargetMode, type TokenActionMode } from "@/lib/vtt/action-mode";
import {
  previewAreaCast,
  previewAreaDirectionStep,
  previewAttackOnTarget,
  previewMove,
  type ActionPreview,
} from "@/lib/combat/action-preview";
import { BattlefieldActionHud } from "@/components/vtt/BattlefieldActionHud";
import { EndTurnBar } from "@/components/vtt/EndTurnBar";
import { TurnOrderPanel } from "@/components/vtt/TurnOrderPanel";
import { useCombatTurn } from "@/hooks/useCombatActions";
import { useTokenImages } from "@/hooks/vtt/useTokenImages";
import { usePortraitFocusByToken } from "@/hooks/vtt/usePortraitFocusByToken";
import { useBattlefieldHighlights } from "@/hooks/vtt/useBattlefieldHighlights";
import { useBattlefieldView } from "@/hooks/vtt/useBattlefieldView";
import { useHexCanvas, type HexCanvasDrawState } from "@/hooks/vtt/useHexCanvas";
import { useBattlefieldPointer } from "@/hooks/vtt/useBattlefieldPointer";
import { useMonsterSpawnDrop } from "@/hooks/vtt/useMonsterSpawnDrop";
import { paTurnRulesForActor } from "@/lib/combat/pa-economy";
import { canMoveToken, type MovementPathContext } from "@/lib/vtt/movement";
import { animateTokenAlongPath } from "@/lib/vtt/token-move-animation";
import "./vtt.css";

type Props = {
  scene: BattleScene;
  canEdit: boolean;
  canControlCombat?: boolean;
  canEndTurn?: boolean;
  canControlToken?: (token: import("@/lib/vtt/types").BattleToken) => boolean;
  canViewTokenPa?: (token: import("@/lib/vtt/types").BattleToken) => boolean;
  roomId?: string;
  adventureId?: string;
  inviteCode?: string | null;
  snapshot?: RoomSnapshot | null;
  onRefresh?: () => void;
  onApplySnapshot?: (snap: RoomSnapshot) => void;
  onOpenSheet?: (actorId?: string) => void;
  onHoverAxialChange?: (axial: Axial | null) => void;
  showSpawnInSidebar?: boolean;
  session?: import("@/lib/auth/types").SessionUser | null;
  roomActors?: Record<string, import("@/lib/room/types").RoomActor>;
  leftPanel?: MesaPanelLayout;
  onLeftPanelChange?: (patch: Partial<MesaPanelLayout>) => void;
  /** Mapa em tela cheia; tokens em janela flutuante (Foundry). */
  foundryLayout?: boolean;
  actorsWindowLayout?: FoundryWindowLayout;
  onActorsWindowLayoutChange?: (patch: Partial<FoundryWindowLayout>) => void;
  onActorsWindowClose?: () => void;
  onActorsWindowMinimize?: () => void;
  onActorsWindowFocus?: () => void;
  gmWindowLayout?: FoundryWindowLayout;
  onGmWindowLayoutChange?: (patch: Partial<FoundryWindowLayout>) => void;
  onGmWindowClose?: () => void;
  onGmWindowMinimize?: () => void;
  onGmWindowFocus?: () => void;
  initiativeWindowLayout?: FoundryWindowLayout;
  onInitiativeWindowLayoutChange?: (patch: Partial<FoundryWindowLayout>) => void;
  onInitiativeWindowClose?: () => void;
  onInitiativeWindowMinimize?: () => void;
  onInitiativeWindowFocus?: () => void;
};

export function HexBattlefield({
  scene: initial,
  canEdit,
  canControlCombat = false,
  canEndTurn: canEndTurnProp = false,
  canControlToken,
  canViewTokenPa,
  roomId = "demo",
  adventureId: adventureIdProp,
  inviteCode = null,
  snapshot = null,
  onRefresh,
  onApplySnapshot,
  onOpenSheet,
  onHoverAxialChange,
  showSpawnInSidebar = true,
  session = null,
  roomActors = {},
  leftPanel,
  onLeftPanelChange,
  foundryLayout = false,
  actorsWindowLayout,
  onActorsWindowLayoutChange,
  onActorsWindowClose,
  onActorsWindowMinimize,
  onActorsWindowFocus,
  gmWindowLayout,
  onGmWindowLayoutChange,
  onGmWindowClose,
  onGmWindowMinimize,
  onGmWindowFocus,
  initiativeWindowLayout,
  onInitiativeWindowLayoutChange,
  onInitiativeWindowClose,
  onInitiativeWindowMinimize,
  onInitiativeWindowFocus,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial.tokens[0]?.id ?? null);
  const [actionMode, setActionMode] = useState<TokenActionMode>("idle");
  const [selectedCombatAction, setSelectedCombatAction] = useState<CombatActionOption | null>(null);
  const [hoverAxial, setHoverAxial] = useState<Axial | null>(null);
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);
  const [hoverTokenId, setHoverTokenId] = useState<string | null>(null);
  const [areaCenter, setAreaCenter] = useState<Axial | null>(null);
  const [combatFx, setCombatFx] = useState<CombatFxState | null>(null);
  const [tokenFlash, setTokenFlash] = useState<{
    tokenId: string;
    kind: NonNullable<TokenCombatFlash>;
  } | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [channelExtraPa, setChannelExtraPa] = useState(0);
  const [actionRingAt, setActionRingAt] = useState<{ x: number; y: number } | null>(null);
  const seenCombatRef = useRef<Set<string>>(new Set());
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [mapImgTick, setMapImgTick] = useState(0);

  const displayScene = snapshot?.scene ?? scene;
  const displayPings = snapshot?.pings ?? [];

  useEffect(() => {
    const url = displayScene.mapImageUrl?.trim();
    if (!url) {
      setMapImage(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setMapImage(img);
      setMapImgTick((n) => n + 1);
    };
    img.onerror = () => setMapImage(null);
    img.src = url;
  }, [displayScene.mapImageUrl]);

  const playerActorIds = useMemo(
    () =>
      session?.id
        ? Object.entries(roomActors)
            .filter(([, a]) => a.ownerId === session.id)
            .map(([id]) => id)
        : [],
    [roomActors, session?.id]
  );

  const visibleHexSet = useMemo(() => {
    if (canControlCombat) return null;
    return visibleHexSetForPlayer(displayScene, displayScene.tokens, {
      userId: session?.id,
      actorIds: playerActorIds,
    });
  }, [canControlCombat, displayScene, playerActorIds, session?.id]);

  const listTokens = useMemo(() => {
    if (canControlCombat) return displayScene.tokens;
    return filterTokensForFog(displayScene.tokens, displayScene, visibleHexSet, {
      userId: session?.id,
      actorIds: playerActorIds,
    });
  }, [canControlCombat, displayScene, visibleHexSet, session?.id, playerActorIds]);

  useEffect(() => {
    if (!selectedId) return;
    if (listTokens.some((t) => t.id === selectedId)) return;
    setSelectedId(listTokens[0]?.id ?? null);
  }, [listTokens, selectedId]);

  const { imagesRef, imgTick } = useTokenImages(displayScene.tokens);
  const refresh = onRefresh ?? (() => {});
  const turnActiveId = snapshot?.combat ? activeTokenId(snapshot.combat) : null;
  const turn = useCombatTurn({ combat: snapshot?.combat, canBypassTurn: canControlCombat });

  const tokenControl =
    canControlToken ?? ((t: BattleToken) => canControlCombat || Boolean(t.linked));

  const canOperateToken = useCallback(
    (t: BattleToken) => {
      if (t.monsterEntryId) return canControlCombat;
      return canControlCombat || tokenControl(t);
    },
    [canControlCombat, tokenControl]
  );

  const canPreviewTurnMove = useCallback(
    (t: BattleToken) => {
      const track = snapshot?.combat;
      if (!track?.order.length) return false;
      const activeId = activeTokenId(track);
      if (!activeId || t.id !== activeId) return false;
      return canOperateToken(t);
    },
    [snapshot?.combat, canOperateToken]
  );

  const selected = listTokens.find((t) => t.id === selectedId) ?? null;
  const selectedActor =
    selected?.linked && selected.actorId ? snapshot?.actors[selected.actorId] ?? null : null;

  const activeCombatAction = useMemo(() => {
    if (selectedCombatAction) return selectedCombatAction;
    if (selectedActor) return resolveCombatAction(selectedActor);
    if (selected) return listTokenCombatActions(selected, null)[0] ?? null;
    return null;
  }, [selectedCombatAction, selectedActor, selected]);

  const focusByTokenId = usePortraitFocusByToken(displayScene.tokens, snapshot?.actors);

  const actorRacas = useMemo(() => {
    const out: Record<string, string | undefined> = {};
    if (!snapshot?.actors) return out;
    for (const [id, a] of Object.entries(snapshot.actors)) {
      out[id] = a.identity.raca;
    }
    return out;
  }, [snapshot?.actors]);

  const moveAnimRef = useRef<{ tokenId: string; q: number; r: number } | null>(null);
  const moveBusyRef = useRef(false);
  const combatFxIdRef = useRef<string | null>(null);

  const syncRoom = useCallback(
    (snap?: RoomSnapshot) => {
      if (snap) {
        setScene(snap.scene);
        if (onApplySnapshot) onApplySnapshot(snap);
        else refresh();
      } else {
        refresh();
      }
    },
    [onApplySnapshot, refresh]
  );

  const battlefieldView = useBattlefieldView({ wrapRef, canvasRef });

  const { spawnDragActive, spawnDropHandlers } = useMonsterSpawnDrop({
    wrapRef,
    canvasRef,
    scene: displayScene,
    roomId,
    enabled: canControlCombat,
    onSpawned: syncRoom,
    setHoverAxial,
    onHoverAxialChange,
    onError: setActionErr,
    viewRef: battlefieldView.viewRef,
  });

  const hoverTurnToken = listTokens.find((t) => t.id === hoverTokenId) ?? null;
  const hoverTurnActor =
    hoverTurnToken?.linked && hoverTurnToken.actorId
      ? snapshot?.actors[hoverTurnToken.actorId] ?? null
      : null;

  const highlights = useBattlefieldHighlights({
    scene: displayScene,
    actorRacas,
    selected,
    selectedActor,
    actionMode,
    activeCombatAction,
    hoverAxial,
    hoverTurnToken,
    hoverTurnActor,
    canPreviewTurnMove,
    areaCenter,
    areaDirection: null,
    turn,
  });

  const canvasState: HexCanvasDrawState = useMemo(
    () => ({
      scene: displayScene,
      gridCells: highlights.gridCells,
      showMovement: highlights.showMovement,
      turnMovePreview: highlights.turnMovePreview,
      walkSet: highlights.walkSet,
      paidWalkSet: highlights.paidWalkSet,
      rangeSet: highlights.rangeSet,
      actionMode,
      attackRangeSet: highlights.attackRangeSet,
      isAreaSpellMode: highlights.isAreaSpellMode,
      areaPreviewSet: highlights.areaPreviewSet,
      areaDirectionSet: highlights.areaDirectionSet,
      hoverAxial,
      hoverMovePreview: highlights.hoverMovePreview,
      spawnDropHover: spawnDragActive && canControlCombat,
      pathCells: highlights.hoverPathCells ?? [],
      focusByTokenId,
      selectedId,
      turnActiveId,
      attackableIds: highlights.attackableIds,
      hoverAttackTargetId: hoverTargetId,
      hoverTurnMoveTokenId: highlights.turnMovePreview ? hoverTokenId : null,
      tokenFlash,
      visibleHexSet,
      pings: displayPings,
      mapImage,
    }),
    [
      displayScene,
      highlights,
      actionMode,
      hoverAxial,
      spawnDragActive,
      canControlCombat,
      focusByTokenId,
      selectedId,
      turnActiveId,
      hoverTargetId,
      hoverTokenId,
      tokenFlash,
      visibleHexSet,
      displayPings,
      mapImage,
    ]
  );

  const { redraw } = useHexCanvas(
    canvasRef,
    wrapRef,
    imagesRef,
    canvasState,
    imgTick + mapImgTick,
    moveAnimRef,
    battlefieldView.view
  );

  useEffect(() => {
    if (!snapshot?.chat) return;
    for (const msg of snapshot.chat) {
      if (msg.kind !== "combat" || !msg.combat || seenCombatRef.current.has(msg.id)) continue;
      if (combatFxIdRef.current === msg.id) continue;
      seenCombatRef.current.add(msg.id);
      const defender = snapshot.scene.tokens.find((t) => t.id === msg.combat!.defenderTokenId);
      const attacker = snapshot.scene.tokens.find((t) => t.id === msg.combat!.attackerTokenId);
      if (!defender || !attacker) continue;
      const fx = combatFxFromMessage(msg, attacker.axial, defender.axial);
      if (fx) {
        combatFxIdRef.current = fx.id;
        setCombatFx(fx);
      }
    }
  }, [snapshot?.chat, snapshot?.scene.tokens]);

  useEffect(() => {
    if (!snapshot || moveBusyRef.current) return;
    setScene(snapshot.scene);
  }, [snapshot]);

  useEffect(() => {
    setActionMode("idle");
    setSelectedCombatAction(null);
    setActionErr(null);
    setAreaCenter(null);
    setHoverTargetId(null);
  }, [selectedId]);

  useEffect(() => {
    setAreaCenter(null);
    setChannelExtraPa(0);
  }, [actionMode, selectedCombatAction?.entryId]);

  useEffect(() => {
    setActionRingAt(null);
  }, [selectedId, snapshot?.combat?.activeIndex, snapshot?.combat?.round]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (actionRingAt) {
        setActionRingAt(null);
        return;
      }
      if (actionMode !== "idle") {
        setActionMode("idle");
        setSelectedCombatAction(null);
        setChannelExtraPa(0);
        setActionErr(null);
        setAreaCenter(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actionRingAt, actionMode]);

  const triggerCombatFx = useCallback(
    (msg: ChatMessage) => {
      if (msg.kind !== "combat" || !msg.combat) return;
      if (seenCombatRef.current.has(msg.id) && combatFxIdRef.current === msg.id) return;
      seenCombatRef.current.add(msg.id);
      const defender = displayScene.tokens.find((t) => t.id === msg.combat!.defenderTokenId);
      const attacker = displayScene.tokens.find((t) => t.id === msg.combat!.attackerTokenId);
      if (!defender || !attacker) return;
      const fx = combatFxFromMessage(msg, attacker.axial, defender.axial);
      if (fx) {
        combatFxIdRef.current = fx.id;
        setCombatFx(fx);
      }
    },
    [displayScene.tokens]
  );

  const onCombatFxDone = useCallback(() => {
    combatFxIdRef.current = null;
    setCombatFx(null);
    setTokenFlash(null);
  }, []);

  const onCombatTokenFlash = useCallback((tokenId: string | null, kind: import("@/lib/vtt/draw-battlefield").TokenFlashKind | null) => {
    if (tokenId && kind) setTokenFlash({ tokenId, kind });
    else setTokenFlash(null);
  }, []);

  const tokenDrawPosition = useCallback(
    (token: import("@/lib/vtt/types").BattleToken) => {
      const anim = moveAnimRef.current;
      if (anim && anim.tokenId === token.id) return { q: anim.q, r: anim.r };
      return token.axial;
    },
    []
  );

  const castAreaSpell = useCallback(
    async (center: Axial, direction?: number) => {
      if (!selected || !activeCombatAction?.areaShape) return;
      setActionErr(null);
      try {
        const snap = await postRoomAreaSpell(roomId, selected.id, center.q, center.r, {
          actionEntryId: activeCombatAction.entryId,
          bypassTurn: turn.bypassTurn,
          areaDirection: direction,
          channelExtraPa,
        });
        const combatMsgs = snap.chat.filter((m) => m.kind === "combat");
        const last = combatMsgs[combatMsgs.length - 1];
        if (last?.kind === "combat") triggerCombatFx(last);
        setActionMode("idle");
        setAreaCenter(null);
        syncRoom(snap);
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Falha na magia de área");
      }
    },
    [selected, activeCombatAction, roomId, turn.bypassTurn, channelExtraPa, syncRoom, triggerCombatFx]
  );

  const actionPreview: ActionPreview | null = useMemo(() => {
    if (!selected) return null;
    if (highlights.showMovement && hoverAxial) {
      const movePaOpts = selectedActor
        ? { freeBasicMovePa: paTurnRulesForActor(selectedActor).freeBasicMovePa }
        : undefined;
      const moveCtx: MovementPathContext = {
        tokens: displayScene.tokens,
        gridRadius: displayScene.gridRadius,
        actorRacas,
      };
      return previewMove(selected, hoverAxial, highlights.moveMode, movePaOpts, moveCtx);
    }
    if (highlights.needsAreaDirection && activeCombatAction) {
      const shape = activeCombatAction.areaShape;
      if (shape === "cone" || shape === "line") {
        return previewAreaDirectionStep(shape, selected);
      }
    }
    if (highlights.isAreaSpellMode && activeCombatAction && hoverAxial) {
      const center = highlights.needsAreaDirection ? areaCenter : hoverAxial;
      if (center) {
        return previewAreaCast(
          selected,
          center,
          selectedActor,
          activeCombatAction,
          turn,
          null,
          channelExtraPa
        );
      }
    }
    if (
      hoverTargetId &&
      activeCombatAction &&
      isTargetMode(actionMode) &&
      !highlights.isAreaSpellMode
    ) {
      const defender = displayScene.tokens.find((t) => t.id === hoverTargetId);
      if (defender) {
        return previewAttackOnTarget(
          selected,
          defender,
          selectedActor,
          activeCombatAction,
          displayScene.tokens,
          turn,
          channelExtraPa
        );
      }
    }
    return null;
  }, [
    selected,
    selectedActor,
    hoverAxial,
    hoverTargetId,
    highlights,
    activeCombatAction,
    actionMode,
    areaCenter,
    displayScene,
    turn,
    channelExtraPa,
  ]);

  const attackToken = useCallback(
    async (defenderId: string) => {
      if (!selected || !activeCombatAction) return;
      setActionErr(null);
      try {
        let snap: RoomSnapshot;
        if (activeCombatAction.kind === "ability") {
          snap = await postRoomAbility(roomId, selected.id, defenderId, {
            actionEntryId: activeCombatAction.entryId,
            bypassTurn: turn.bypassTurn,
          });
        } else {
          const packId =
            activeCombatAction.packId === "armas" || activeCombatAction.packId === "magias"
              ? activeCombatAction.packId
              : undefined;
          snap = await postRoomAttack(roomId, selected.id, defenderId, {
            actionPack: packId,
            actionEntryId: packId ? activeCombatAction.entryId : undefined,
            bypassTurn: turn.bypassTurn,
            channelExtraPa,
          });
        }
        const combatMsgs = snap.chat.filter((m) => m.kind === "combat");
        const last = combatMsgs[combatMsgs.length - 1];
        if (last?.kind === "combat") triggerCombatFx(last);
        setActionMode("idle");
        syncRoom(snap);
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Falha no ataque");
      }
    },
    [selected, activeCombatAction, roomId, turn.bypassTurn, channelExtraPa, syncRoom, triggerCombatFx]
  );

  const moveSelectedTo = useCallback(
    async (axial: Axial) => {
      if (!selected || !isMoveMode(actionMode) || moveBusyRef.current) return;
      const moveCtx: MovementPathContext = {
        tokens: displayScene.tokens,
        gridRadius: displayScene.gridRadius,
        actorRacas,
      };
      const movePaOpts = selectedActor?.identity
        ? { freeBasicMovePa: paTurnRulesForActor(selectedActor).freeBasicMovePa }
        : undefined;
      const check = canMoveToken(selected, axial, highlights.moveMode, moveCtx, movePaOpts);
      if (!check.ok) {
        setActionErr(check.reason ?? "Movimento inválido");
        return;
      }
      setActionErr(null);
      moveBusyRef.current = true;
      const path = check.path ?? [selected.axial, axial];
      try {
        await animateTokenAlongPath(path, (step) => {
          moveAnimRef.current = { tokenId: selected.id, q: step.q, r: step.r };
          redraw();
        });
        const snap = await moveRoomTokenBudget(
          roomId,
          selected.id,
          axial.q,
          axial.r,
          highlights.moveMode,
          turn.bypassTurn
        );
        moveAnimRef.current = null;
        syncRoom(snap);
        redraw();
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Movimento inválido");
        moveAnimRef.current = null;
        redraw();
      } finally {
        moveBusyRef.current = false;
      }
    },
    [
      selected,
      actionMode,
      roomId,
      highlights.moveMode,
      turn.bypassTurn,
      syncRoom,
      redraw,
      displayScene.tokens,
      displayScene.gridRadius,
      actorRacas,
    ]
  );

  const onGmReposition = useCallback(
    async (tokenId: string, axial: Axial) => {
      setActionErr(null);
      try {
        const snap = await repositionRoomToken(roomId, tokenId, axial.q, axial.r);
        moveAnimRef.current = null;
        syncRoom(snap);
        redraw();
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Falha ao mover token");
        moveAnimRef.current = null;
        redraw();
      }
    },
    [roomId, syncRoom, redraw]
  );

  const onGmDragPreview = useCallback(
    (tokenId: string, axial: Axial | null) => {
      if (axial) {
        moveAnimRef.current = { tokenId, q: axial.q, r: axial.r };
      } else {
        moveAnimRef.current = null;
      }
      redraw();
    },
    [redraw]
  );

  const onMapPing = useCallback(
    async (axial: Axial) => {
      setActionErr(null);
      try {
        const color = selected?.color ?? "#c9a962";
        const snap = await postRoomPing(roomId, axial.q, axial.r, color);
        syncRoom(snap);
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Falha ao pingar");
      }
    },
    [roomId, selected?.color, syncRoom]
  );

  const onRevealHex = useCallback(
    async (axial: Axial) => {
      if (!canControlCombat || !displayScene.fogEnabled) return;
      setActionErr(null);
      try {
        const snap = await revealRoomHex(roomId, axial.q, axial.r);
        syncRoom(snap);
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Falha ao revelar hex");
      }
    },
    [roomId, canControlCombat, displayScene.fogEnabled, syncRoom]
  );

  const pointer = useBattlefieldPointer({
    canvasRef,
    scene: displayScene,
    tokenDrawPosition,
    selectedId,
    setSelectedId,
    actionMode,
    activeCombatAction,
    attackableIds: highlights.attackableIds,
    hoverAxial,
    setHoverAxial,
    onHoverAxialChange,
    showMovement: highlights.showMovement,
    isAreaSpellMode: highlights.isAreaSpellMode,
    needsAreaDirection: highlights.needsAreaDirection,
    areaCenter,
    setAreaCenter,
    selected,
    turn,
    canControlCombat,
    canGmReposition: canControlCombat,
    onGmReposition: (id, a) => void onGmReposition(id, a),
    onGmDragPreview,
    onHoverTargetChange: setHoverTargetId,
    onHoverTokenChange: setHoverTokenId,
    onAttack: (id) => void attackToken(id),
    onMove: (a) => void moveSelectedTo(a),
    onAreaSpell: (c, d) => void castAreaSpell(c, d),
    onAreaSpellError: setActionErr,
    onPing: (a) => void onMapPing(a),
    onRevealHex: canControlCombat ? (a) => void onRevealHex(a) : undefined,
    fogEnabled: Boolean(displayScene.fogEnabled),
    viewRef: battlefieldView.viewRef,
    onActionRingRequest: (_token, clientX, clientY) => {
      setActionRingAt({ x: clientX, y: clientY });
      setActionErr(null);
    },
    canOpenActionRing: canPreviewTurnMove,
  });

  const canViewTokenPaFn =
    canViewTokenPa ?? (() => canControlCombat || Boolean(selected?.linked));

  const canUseToken =
    selected &&
    ((selected.monsterEntryId && canControlCombat) ||
      (!selected.monsterEntryId && (canControlCombat || tokenControl(selected))));

  const combat = snapshot?.combat;
  const canEndTurn = canEndTurnProp;

  const attackTargetCursor =
    actionMode === "attack" &&
    isTargetMode(actionMode) &&
    activeCombatAction &&
    !activeCombatAction.selfTarget &&
    !highlights.isAreaSpellMode;

  const leftW =
    !foundryLayout && leftPanel ? effectiveMesaPanelWidth(leftPanel) : undefined;
  const shellStyle =
    leftW != null ? { gridTemplateColumns: `${leftW}px minmax(0, 1fr)` } : undefined;

  const fogListHint = Boolean(displayScene.fogEnabled && !canControlCombat);

  const actorsPanel = (
    <ActiveCharactersPanel
      tokens={listTokens}
      selectedId={selectedId}
      onSelect={setSelectedId}
      selected={selected}
      combat={combat}
      canViewTokenPa={canViewTokenPaFn}
      canUseToken={Boolean(canUseToken)}
      canControlCombat={canControlCombat}
      showMovementLegend={Boolean(selected && highlights.showMovement)}
      actionMode={actionMode}
      actionErr={actionErr}
      roomId={roomId}
      onOpenSheet={onOpenSheet}
      onUpdate={refresh}
      fogHint={fogListHint}
    />
  );

  const gmPanel =
    canControlCombat && snapshot ? (
      <GmMenuPanel
        roomId={roomId}
        scene={displayScene}
        snapshot={snapshot}
        inviteCode={inviteCode}
        session={session}
        roomActors={roomActors}
        spawnAxial={hoverAxial}
        canEdit={canEdit}
        adventureId={adventureIdProp}
        onSceneUpdated={(snap) => syncRoom(snap)}
      />
    ) : null;

  const legacySidebar = (
    <>
      {actorsPanel}
      {gmPanel}
      {canControlCombat && showSpawnInSidebar ? (
        <MonsterSpawnPanel roomId={roomId} spawnAxial={hoverAxial} onSpawned={(snap) => syncRoom(snap)} />
      ) : null}
    </>
  );

  const [hudRoot, setHudRoot] = useState<HTMLElement | null>(null);
  const resolveHudRoot = useCallback(() => document.getElementById("foundry-mesa-windows"), []);

  useLayoutEffect(() => {
    setHudRoot(resolveHudRoot());
  }, [resolveHudRoot]);

  useEffect(() => {
    if (hudRoot) return;
    const id = window.requestAnimationFrame(() => setHudRoot(resolveHudRoot()));
    return () => window.cancelAnimationFrame(id);
  }, [hudRoot, resolveHudRoot]);

  const actorsWindow =
    foundryLayout && actorsWindowLayout && onActorsWindowLayoutChange ? (
      <FoundryWindow
        title="Personagens ativos"
        layout={actorsWindowLayout}
        className="foundry-window--actors"
        onLayoutChange={onActorsWindowLayoutChange}
        onClose={onActorsWindowClose ?? (() => {})}
        onMinimize={onActorsWindowMinimize ?? (() => {})}
        onFocus={onActorsWindowFocus ?? (() => {})}
        minHeight={200}
      >
        <div className="mesa-panel-scroll mesa-panel-scroll--rail">{actorsPanel}</div>
      </FoundryWindow>
    ) : null;

  const actorsPortal =
    actorsWindow && hudRoot ? createPortal(actorsWindow, hudRoot) : actorsWindow;

  const gmWindow =
    foundryLayout &&
    canControlCombat &&
    gmWindowLayout &&
    onGmWindowLayoutChange &&
    gmPanel ? (
      <FoundryWindow
        title="Menu do mestre"
        layout={gmWindowLayout}
        className="foundry-window--gm"
        onLayoutChange={onGmWindowLayoutChange}
        onClose={onGmWindowClose ?? (() => {})}
        onMinimize={onGmWindowMinimize ?? (() => {})}
        onFocus={onGmWindowFocus ?? (() => {})}
        minHeight={220}
      >
        <div className="mesa-panel-scroll mesa-panel-scroll--rail">{gmPanel}</div>
      </FoundryWindow>
    ) : null;

  const gmPortal = gmWindow && hudRoot ? createPortal(gmWindow, hudRoot) : gmWindow;

  const initiativeWindow =
    foundryLayout &&
    initiativeWindowLayout &&
    onInitiativeWindowLayoutChange &&
    combat ? (
      <FoundryWindow
        title="Iniciativa"
        layout={initiativeWindowLayout}
        className="foundry-window--initiative"
        onLayoutChange={onInitiativeWindowLayoutChange}
        onClose={onInitiativeWindowClose ?? (() => {})}
        onMinimize={onInitiativeWindowMinimize ?? (() => {})}
        onFocus={onInitiativeWindowFocus ?? (() => {})}
        minHeight={220}
      >
        <div className="mesa-panel-scroll mesa-panel-scroll--rail">
          <TurnOrderPanel
            roomId={roomId}
            combat={combat}
            tokens={listTokens}
            canControl={canControlCombat}
            canEndTurn={canEndTurnProp}
            onUpdate={refresh}
            attackableIds={highlights.attackableIds}
            hoverAttackTargetId={hoverTargetId}
            onHoverAttackTargetChange={setHoverTargetId}
          />
        </div>
      </FoundryWindow>
    ) : null;

  const initiativePortal =
    initiativeWindow && hudRoot ? createPortal(initiativeWindow, hudRoot) : initiativeWindow;

  return (
    <div
      className={`vtt-shell${foundryLayout ? " vtt-shell--foundry" : ""}`}
      style={shellStyle}
    >
      {foundryLayout ? actorsPortal : null}
      {foundryLayout ? gmPortal : null}
      {foundryLayout ? initiativePortal : null}
      {!foundryLayout && leftPanel && onLeftPanelChange ? (
        <MesaDockPanel
          side="left"
          label="Personagens"
          layout={leftPanel}
          onLayoutChange={onLeftPanelChange}
        >
          {legacySidebar}
        </MesaDockPanel>
      ) : !foundryLayout ? (
        legacySidebar
      ) : null}

      <div
        ref={wrapRef}
        className={`vtt-canvas-wrap${attackTargetCursor ? " vtt-canvas-wrap--attack-target" : ""}${spawnDragActive ? " vtt-canvas-wrap--spawn-drop" : ""}${battlefieldView.isPanning ? " vtt-canvas-wrap--panning" : ""}`}
        onWheel={battlefieldView.onWheel}
        {...spawnDropHandlers}
      >
        <BattlefieldViewControls
          zoomPercent={battlefieldView.zoomPercent}
          canZoomIn={battlefieldView.canZoomIn}
          canZoomOut={battlefieldView.canZoomOut}
          onZoomIn={battlefieldView.zoomIn}
          onZoomOut={battlefieldView.zoomOut}
          onReset={battlefieldView.resetView}
        />
        <canvas
          ref={canvasRef}
          className="vtt-canvas"
          onPointerDown={(e) => {
            if (battlefieldView.onPointerDown(e)) return;
            pointer.onPointerDown(e);
          }}
          onPointerMove={(e) => {
            if (battlefieldView.onPointerMove(e)) return;
            pointer.onPointerMove(e);
          }}
          onPointerUp={(e) => {
            if (battlefieldView.endPan(e)) return;
            pointer.onPointerUp(e);
          }}
          onPointerLeave={(e) => {
            battlefieldView.endPan(e);
            pointer.onPointerLeave();
          }}
          onContextMenu={pointer.onContextMenu}
        />
        {actionRingAt && selected && canPreviewTurnMove(selected) ? (
          <TokenActionRing
            x={actionRingAt.x}
            y={actionRingAt.y}
            token={selected}
            actor={selectedActor}
            combat={snapshot?.combat}
            canBypassTurn={canControlCombat}
            roomId={roomId}
            onPickMode={(mode, action) => {
              setActionMode(mode);
              setSelectedCombatAction(action);
              if (mode !== "spell") setChannelExtraPa(0);
            }}
            onClose={() => setActionRingAt(null)}
            onRoomSync={() => refresh()}
          />
        ) : null}
        {actionMode === "spell" &&
        selectedCombatAction?.channelMaxExtraPa &&
        selected &&
        canUseToken ? (
          <div className="vtt-channel-float glass-panel">
            <SpellChannelControl
              action={selectedCombatAction}
              token={selected}
              actor={selectedActor}
              value={channelExtraPa}
              onChange={setChannelExtraPa}
            />
          </div>
        ) : null}
        {combat ? (
          <EndTurnBar
            roomId={roomId}
            combat={combat}
            tokens={displayScene.tokens}
            canEndTurn={canEndTurn}
            isGm={canControlCombat}
            onUpdate={refresh}
          />
        ) : null}
        <BattlefieldActionHud preview={actionPreview} />
        <CombatFxLayer
          wrapRef={wrapRef}
          hexSize={scene.hexSize}
          fx={combatFx}
          view={battlefieldView.view}
          onTokenFlash={onCombatTokenFlash}
          onDone={onCombatFxDone}
        />
      </div>
    </div>
  );
}
