"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import type { BattleScene } from "@/lib/vtt/types";
import {
  moveRoomTokenBudget,
  postRoomAttack,
  postRoomAbility,
  postRoomAreaSpell,
  postRoomPing,
  revealRoomHex,
  repositionRoomToken,
} from "@/hooks/useRoomSync";
import { visibleHexSetForPlayer } from "@/lib/vtt/fog-of-war";
import { MapScenePanel } from "@/components/vtt/MapScenePanel";
import { RoomSettingsPanel } from "@/components/vtt/RoomSettingsPanel";
import { PlayerSpawnPanel } from "@/components/vtt/PlayerSpawnPanel";
import type { RoomSnapshot } from "@/lib/room/types";
import { TurnOrderPanel } from "@/components/vtt/TurnOrderPanel";
import { TokenActionPanel } from "@/components/vtt/TokenActionPanel";
import { MonsterSpawnPanel } from "@/components/vtt/MonsterSpawnPanel";
import { TokenConditionsPanel } from "@/components/vtt/TokenConditionsPanel";
import { BattlefieldViewControls } from "@/components/vtt/BattlefieldViewControls";
import { MesaDockPanel } from "@/components/vtt/MesaDockPanel";
import type { MesaPanelLayout } from "@/lib/vtt/mesa-panel-layout";
import { effectiveMesaPanelWidth } from "@/lib/vtt/mesa-panel-layout";
import { TokenEffectsRow } from "@/components/vtt/TokenEffectsRow";
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
import {
  isMoveMode,
  isTargetMode,
  type TokenActionMode,
} from "@/lib/vtt/action-mode";
import {
  previewAreaCast,
  previewAreaDirectionStep,
  previewAttackOnTarget,
  previewMove,
  type ActionPreview,
} from "@/lib/combat/action-preview";
import { BattlefieldActionHud } from "@/components/vtt/BattlefieldActionHud";
import { PaDotMeter } from "@/components/vtt/PaDotMeter";
import { EndTurnBar } from "@/components/vtt/EndTurnBar";
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
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial.tokens[0]?.id ?? null);
  const [actionMode, setActionMode] = useState<TokenActionMode>("idle");
  const [selectedCombatAction, setSelectedCombatAction] = useState<CombatActionOption | null>(null);
  const [hoverAxial, setHoverAxial] = useState<Axial | null>(null);
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);
  const [areaCenter, setAreaCenter] = useState<Axial | null>(null);
  const [combatFx, setCombatFx] = useState<CombatFxState | null>(null);
  const [tokenFlash, setTokenFlash] = useState<{
    tokenId: string;
    kind: NonNullable<TokenCombatFlash>;
  } | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [channelExtraPa, setChannelExtraPa] = useState(0);
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

  const visibleHexSet = useMemo(() => {
    if (canControlCombat) return null;
    const actorIds = session?.id
      ? Object.entries(roomActors)
          .filter(([, a]) => a.ownerId === session.id)
          .map(([id]) => id)
      : [];
    return visibleHexSetForPlayer(displayScene, displayScene.tokens, {
      userId: session?.id,
      actorIds,
    });
  }, [canControlCombat, displayScene, roomActors, session?.id]);

  const { imagesRef, imgTick } = useTokenImages(displayScene.tokens);
  const refresh = onRefresh ?? (() => {});
  const turnActiveId = snapshot?.combat ? activeTokenId(snapshot.combat) : null;
  const turn = useCombatTurn({ combat: snapshot?.combat, canBypassTurn: canControlCombat });

  const selected = displayScene.tokens.find((t) => t.id === selectedId) ?? null;
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

  const highlights = useBattlefieldHighlights({
    scene: displayScene,
    actorRacas,
    selected,
    selectedActor,
    actionMode,
    activeCombatAction,
    hoverAxial,
    areaCenter,
    areaDirection: null,
    turn,
  });

  const canvasState: HexCanvasDrawState = useMemo(
    () => ({
      scene: displayScene,
      gridCells: highlights.gridCells,
      showMovement: highlights.showMovement,
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
    onAttack: (id) => void attackToken(id),
    onMove: (a) => void moveSelectedTo(a),
    onAreaSpell: (c, d) => void castAreaSpell(c, d),
    onAreaSpellError: setActionErr,
    onPing: (a) => void onMapPing(a),
    onRevealHex: canControlCombat ? (a) => void onRevealHex(a) : undefined,
    fogEnabled: Boolean(displayScene.fogEnabled),
    viewRef: battlefieldView.viewRef,
  });

  const tokenControl =
    canControlToken ?? (() => canControlCombat || Boolean(selected?.linked));

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

  const leftW = leftPanel ? effectiveMesaPanelWidth(leftPanel) : undefined;
  const shellStyle = leftW != null ? { gridTemplateColumns: `${leftW}px minmax(0, 1fr)` } : undefined;

  const sidebar = (
      <aside className="vtt-sidebar">
        <p className="vtt-eyebrow">Mesa ao vivo</p>
        {snapshot ? (
          <p className="vtt-sync-live">
            <span className="vtt-sync-dot" aria-hidden />
            Sync · rev {snapshot.revision}
          </p>
        ) : null}
        <h2 className="vtt-title">{displayScene.name}</h2>
        <p className="vtt-hint">
          Token → ação → alvo ou hex. Alt+clique: ping. Mestre: arraste token; Ctrl+clique revela hex
          com fog.
        </p>

        {canControlCombat && snapshot ? (
          <RoomSettingsPanel
            roomId={roomId}
            roomName={displayScene.name}
            inviteCode={inviteCode ?? "—"}
            settings={snapshot.settings}
            onUpdated={(snap) => syncRoom(snap)}
          />
        ) : null}

        {canControlCombat ? (
          <MapScenePanel roomId={roomId} scene={displayScene} onUpdated={(snap) => syncRoom(snap)} />
        ) : null}

        {canEdit && Object.keys(roomActors).length > 0 ? (
          <PlayerSpawnPanel
            roomId={roomId}
            actors={roomActors}
            session={session}
            tokens={displayScene.tokens}
            spawnAxial={hoverAxial}
            onPlaced={(snap) => syncRoom(snap)}
            adventureId={adventureIdProp ?? roomId}
            showCreateLink={roomId !== "demo" && canEdit}
          />
        ) : null}

        {canControlCombat && showSpawnInSidebar ? (
          <MonsterSpawnPanel roomId={roomId} spawnAxial={hoverAxial} onSpawned={(snap) => syncRoom(snap)} />
        ) : null}

        {selected && highlights.showMovement ? (
          <p className="vtt-move-legend vtt-combat-hint">
            <span className="vtt-move-legend-swatch vtt-move-legend-swatch--free" /> sem PA extra
            <span className="vtt-move-legend-swatch vtt-move-legend-swatch--paid" /> caminhada +PA
            <span className="vtt-move-legend-swatch vtt-move-legend-swatch--run" /> só corrida
          </p>
        ) : null}

        {selected && (
          <div className="vtt-token-panel">
            <strong style={{ color: selected.color }}>{selected.name}</strong>
            {selected.linked ? (
              <p className="vtt-linked-badge">
                Ficha linkada
                {onOpenSheet ? (
                  <>
                    {" "}
                    ·{" "}
                    <button
                      type="button"
                      className="vtt-inline-link"
                      onClick={() => onOpenSheet(selected.actorId ?? "pc-aventureiro")}
                    >
                      Abrir ficha →
                    </button>
                  </>
                ) : null}
              </p>
            ) : selected.monsterEntryId ? (
              <p className="vtt-linked-badge">Monstro · {selected.monsterEntryId}</p>
            ) : null}
            {selected.vidaMax != null ? (
              <p>
                Vida {selected.vida}/{selected.vidaMax}
              </p>
            ) : null}
            {selected.defesa != null ? (
              <p>
                Defesa {selected.defesa}
                {selected.defesaBonus ? ` (+${selected.defesaBonus} buff)` : ""}
              </p>
            ) : null}
            <TokenEffectsRow token={selected} variant="full" className="vtt-effect-chips--sidebar" />
            {canViewTokenPaFn(selected) ? (
              <PaDotMeter
                current={selected.pa}
                max={selected.paMax}
                banked={selected.bankedPa}
                spentThisTurn={selected.paSpentThisTurn}
              />
            ) : (
              <p className="vtt-combat-hint">PA do monstro — só o mestre vê.</p>
            )}

            {canUseToken ? (
              <TokenActionPanel
                roomId={roomId}
                token={selected}
                tokens={displayScene.tokens}
                actor={selectedActor}
                combat={snapshot?.combat}
                canBypassTurn={canControlCombat}
                actionMode={actionMode}
                onActionModeChange={setActionMode}
                selectedAction={selectedCombatAction}
                onSelectedActionChange={setSelectedCombatAction}
                channelExtraPa={channelExtraPa}
                onChannelExtraPaChange={setChannelExtraPa}
                onAttackResult={triggerCombatFx}
                onRoomSync={syncRoom}
              />
            ) : (
              <p className="vtt-combat-hint">Token sem stats de combate.</p>
            )}
            {actionErr ? <p className="dice-err">{actionErr}</p> : null}

            {canControlCombat ? (
              <TokenConditionsPanel
                roomId={roomId}
                token={selected}
                canEdit={canControlCombat}
                onUpdate={refresh}
              />
            ) : null}
          </div>
        )}

        {combat ? (
          <TurnOrderPanel
            roomId={roomId}
            combat={combat}
            tokens={displayScene.tokens}
            canControl={canControlCombat}
            canEndTurn={canEndTurn}
            onUpdate={refresh}
            attackableIds={highlights.attackableIds}
            hoverAttackTargetId={hoverTargetId}
            onHoverAttackTargetChange={setHoverTargetId}
          />
        ) : null}

        <ul className="vtt-token-list">
          {displayScene.tokens.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={t.id === selectedId ? "active" : ""}
                onClick={() => setSelectedId(t.id)}
              >
                <span className="token-dot" style={{ background: t.color }} />
                <span className="vtt-token-list-label">
                  <span className="vtt-token-list-name">{t.name}</span>
                  {canViewTokenPaFn(t) ? (
                    <PaDotMeter
                      current={t.pa}
                      max={t.paMax}
                      banked={t.bankedPa}
                      showLabel={false}
                      size="sm"
                      compact
                    />
                  ) : null}
                  <TokenEffectsRow token={t} className="vtt-effect-chips--list" max={4} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
  );

  return (
    <div className="vtt-shell" style={shellStyle}>
      {leftPanel && onLeftPanelChange ? (
        <MesaDockPanel
          side="left"
          label="Tokens"
          layout={leftPanel}
          onLayoutChange={onLeftPanelChange}
        >
          {sidebar}
        </MesaDockPanel>
      ) : (
        sidebar
      )}

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
        />
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
