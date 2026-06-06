"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { Axial } from "@/lib/vtt/hex-math";
import type { BattleScene, BattleToken, MapMarkup, MapMarkupDurability } from "@/lib/vtt/types";
import {
  moveRoomTokenBudget,
  patchRoomScene,
  postRoomAttack,
  postRoomAbility,
  postRoomAreaSpell,
  postRoomPing,
  revealRoomHex,
  repositionRoomToken,
  deleteRoomToken,
} from "@/hooks/useRoomSync";
import {
  appendMapMarkup,
  createMapMarkup,
  hitTestMapMarkup,
  mapMarkupsOf,
  moveMapMarkup,
  pruneMapMarkups,
  removeMapMarkup,
  type WhiteboardTool,
} from "@/lib/vtt/map-markup";
import { useVttToast } from "@/components/vtt/VttToast";
import {
  canDeleteMapMarkup,
  canManageAllMapMarkups,
  canManageRoom,
  mapMarkupAuthorId,
} from "@/lib/auth/room-access";
import { normalizeRoomSettings } from "@/lib/room/settings";
import { filterTokensForFog, visibleHexSetForPlayer } from "@/lib/vtt/fog-of-war";
import { resolveTokenHpDisplay } from "@/lib/vtt/token-hp-display";
import { ActiveCharactersPanel } from "@/components/vtt/ActiveCharactersPanel";
import { GmToolsPanel } from "@/components/vtt/GmToolsPanel";
import { DungeonEditorPanel } from "@/components/vtt/DungeonEditorPanel";
import { DrawingToolbar } from "@/components/vtt/DrawingToolbar";
import { WhiteboardPanel } from "@/components/vtt/WhiteboardPanel";
import { FoundryDockPanel } from "@/components/vtt/foundry/FoundryDockPanel";
import type { RoomSnapshot } from "@/lib/room/types";
import { TokenActionRing } from "@/components/vtt/TokenActionRing";
import { SpellChannelControl } from "@/components/vtt/SpellChannelControl";
import { MonsterSpawnPanel } from "@/components/vtt/MonsterSpawnPanel";
import { BattlefieldViewControls } from "@/components/vtt/BattlefieldViewControls";
import { VttHelpButton } from "@/components/vtt/VttHelpButton";
import { MesaDockPanel } from "@/components/vtt/MesaDockPanel";
import { FoundryWindow } from "@/components/vtt/foundry/FoundryWindow";
import type { FoundryWindowLayout, MesaWindowId } from "@/hooks/vtt/useFoundryWindows";
import type { MesaPanelLayout } from "@/lib/vtt/mesa-panel-layout";
import { effectiveMesaPanelWidth } from "@/lib/vtt/mesa-panel-layout";
import { CombatFxLayer, type TokenCombatFlash } from "@/components/vtt/CombatFxLayer";
import type { CombatFxState } from "@/lib/vtt/combat-fx-types";
import { ingestNewCombatFx, isPlayableCombatFxMessage } from "@/lib/vtt/combat-fx-sequence";
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
import { estimateTargetCombatPreview } from "@/lib/combat/hit-chance";
import {
  castFxDuration,
  type ActiveTokenCastFx,
  type TokenCastFxKind,
} from "@/lib/vtt/token-cast-fx";
import { BattlefieldActionHud } from "@/components/vtt/BattlefieldActionHud";
import { EndTurnBar } from "@/components/vtt/EndTurnBar";
import { TurnOrderPanel } from "@/components/vtt/TurnOrderPanel";
import {
  applyDungeonHexEdit,
  type DungeonEditLayer,
  type DungeonEditorTool,
} from "@/components/vtt/DungeonEditorPanel";
import { useCombatTurn } from "@/hooks/useCombatActions";
import { useTokenImages } from "@/hooks/vtt/useTokenImages";
import { usePortraitFocusByToken } from "@/hooks/vtt/usePortraitFocusByToken";
import { useBattlefieldHighlights } from "@/hooks/vtt/useBattlefieldHighlights";
import { useBattlefieldView } from "@/hooks/vtt/useBattlefieldView";
import { useCanvasWrapSize } from "@/hooks/vtt/useCanvasWrapSize";
import { useHexCanvas, type HexCanvasDrawState } from "@/hooks/vtt/useHexCanvas";
import { buildDisplayHexGrid } from "@/lib/vtt/hex-grid";
import {
  mapBackdropTone,
  sampleImageGreenDominance,
  sampleImageLuminance,
} from "@/lib/vtt/map-luminance";
import { useBattlefieldPointer } from "@/hooks/vtt/useBattlefieldPointer";
import { useMonsterSpawnDrop } from "@/hooks/vtt/useMonsterSpawnDrop";
import { paTurnRulesForActor } from "@/lib/combat/pa-economy";
import { canMoveToken, type MovementPathContext } from "@/lib/vtt/movement";
import { animateTokenAlongPath } from "@/lib/vtt/token-move-animation";
import { axialToPixel } from "@/lib/vtt/hex-math";
import { canvasCenter, worldToScreen } from "@/lib/vtt/battlefield-view";
import "./vtt.css";

type Props = {
  scene: BattleScene;
  canEdit: boolean;
  canControlCombat?: boolean;
  /** Desenhar na lousa — jogadores e mestre */
  canUseWhiteboard?: boolean;
  canBypassTurn?: boolean;
  canEndTurn?: boolean;
  canControlToken?: (token: import("@/lib/vtt/types").BattleToken) => boolean;
  canViewTokenPa?: (token: import("@/lib/vtt/types").BattleToken) => boolean;
  roomId?: string;
  roomOwnerId?: string;
  adventureId?: string;
  inviteCode?: string | null;
  snapshot?: RoomSnapshot | null;
  onRefresh?: () => void;
  onApplySnapshot?: (snap: RoomSnapshot) => void;
  onOpenSheet?: (actorId?: string) => void;
  onHoverAxialChange?: (axial: Axial | null) => void;
  onOpenDungeonPanel?: () => void;
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
  dungeonWindowLayout?: FoundryWindowLayout;
  onDungeonWindowLayoutChange?: (patch: Partial<FoundryWindowLayout>) => void;
  onDungeonWindowClose?: () => void;
  onDungeonWindowMinimize?: () => void;
  onDungeonWindowFocus?: () => void;
  whiteboardWindowLayout?: FoundryWindowLayout;
  onWhiteboardWindowLayoutChange?: (patch: Partial<FoundryWindowLayout>) => void;
  onWhiteboardWindowClose?: () => void;
  onWhiteboardWindowMinimize?: () => void;
  onWhiteboardWindowFocus?: () => void;
  isWindowFloating?: (id: MesaWindowId) => boolean;
};

export function HexBattlefield({
  scene: initial,
  canEdit,
  canControlCombat = false,
  canUseWhiteboard = false,
  canBypassTurn: canBypassTurnProp = false,
  canEndTurn: canEndTurnProp = false,
  canControlToken,
  canViewTokenPa,
  roomId = "demo",
  roomOwnerId = "",
  adventureId: adventureIdProp,
  inviteCode = null,
  snapshot = null,
  onRefresh,
  onApplySnapshot,
  onOpenSheet,
  onHoverAxialChange,
  onOpenDungeonPanel,
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
  dungeonWindowLayout,
  onDungeonWindowLayoutChange,
  onDungeonWindowClose,
  onDungeonWindowMinimize,
  onDungeonWindowFocus,
  whiteboardWindowLayout,
  onWhiteboardWindowLayoutChange,
  onWhiteboardWindowClose,
  onWhiteboardWindowMinimize,
  onWhiteboardWindowFocus,
  isWindowFloating,
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
  const [tokenCastFx, setTokenCastFx] = useState<ActiveTokenCastFx[]>([]);
  const [castFxTick, setCastFxTick] = useState(0);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [channelExtraPa, setChannelExtraPa] = useState(0);
  const [actionRingAt, setActionRingAt] = useState<{ x: number; y: number } | null>(null);
  const toast = useVttToast();
  const seenCombatRef = useRef<Set<string>>(new Set());
  const combatChatSeededRef = useRef(false);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [mapImgTick, setMapImgTick] = useState(0);
  const [dungeonLayer, setDungeonLayer] = useState<DungeonEditLayer>("floor");
  const [dungeonModeOpen, setDungeonModeOpen] = useState(false);
  const [dungeonEditorActive, setDungeonEditorActive] = useState(false);
  const [dungeonTool, setDungeonTool] = useState<DungeonEditorTool>("wall");
  const [selectedDungeonObjectId, setSelectedDungeonObjectId] = useState<string | null>(null);
  const [whiteboardActive, setWhiteboardActive] = useState(false);
  const [whiteboardTool, setWhiteboardTool] = useState<WhiteboardTool>("select");
  const [markupColor, setMarkupColor] = useState("#3498db");
  const [markupWidth, setMarkupWidth] = useState(4);
  const [markupDurability, setMarkupDurability] = useState<MapMarkupDurability>("temporary");
  const [markupPreview, setMarkupPreview] = useState<MapMarkup | null>(null);
  const [selectedMarkupId, setSelectedMarkupId] = useState<string | null>(null);
  const [floorPreview, setFloorPreview] = useState<{
    mapImageScale?: number;
    mapImageOffsetX?: number;
    mapImageOffsetY?: number;
  } | null>(null);

  /** `scene` é a fonte de verdade do tabuleiro (sync imediato + SSE). */
  const displayScene = scene;
  const canvasScene = useMemo(() => {
    if (!floorPreview) return displayScene;
    return { ...displayScene, ...floorPreview };
  }, [displayScene, floorPreview]);
  const displayMarkups = useMemo(
    () => pruneMapMarkups(mapMarkupsOf(displayScene)),
    [displayScene]
  );
  const tempMarkupCount = useMemo(
    () => displayMarkups.filter((m) => m.durability === "temporary").length,
    [displayMarkups]
  );
  const displayPings = snapshot?.pings ?? [];

  useEffect(() => {
    const url = displayScene.mapImageUrl?.trim();
    if (!url) {
      setMapImage(null);
      return;
    }
    const img = new Image();
    if (/^https?:\/\//i.test(url)) {
      img.crossOrigin = "anonymous";
    }
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
  const turn = useCombatTurn({ combat: snapshot?.combat, canBypassTurn: canBypassTurnProp });

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

  const isRoomGm = useMemo(
    () => (session ? canManageRoom({ ownerId: roomOwnerId }, session) : false),
    [session, roomOwnerId]
  );

  const canManageMarkups = useMemo(
    () => (session ? canManageAllMapMarkups({ ownerId: roomOwnerId }, session) : roomId === "demo"),
    [session, roomOwnerId, roomId]
  );

  const dungeonMapEditing = isRoomGm && dungeonEditorActive && dungeonLayer === "objects";
  const hasFloorImage = Boolean(displayScene.mapImageUrl?.trim());
  const floorMapEditing =
    isRoomGm && dungeonModeOpen && dungeonLayer === "floor" && hasFloorImage && !whiteboardActive;

  useEffect(() => {
    if (!floorPreview) return;
    setFloorPreview(null);
  }, [
    displayScene.mapImageScale,
    displayScene.mapImageOffsetX,
    displayScene.mapImageOffsetY,
  ]);

  const roomSettings = normalizeRoomSettings(snapshot?.settings);

  const tokenHpDisplay = useMemo(() => {
    const map = new Map<
      string,
      ReturnType<typeof resolveTokenHpDisplay>
    >();
    const hoveredId = hoverTokenId ?? hoverTargetId;
    for (const token of displayScene.tokens) {
      map.set(
        token.id,
        resolveTokenHpDisplay(token, {
          isRoomGm,
          showMonsterHpToPlayers: roomSettings.showMonsterHpToPlayers,
          hovered: hoveredId === token.id,
          session: session ?? null,
          roomActors,
          roomOwnerId,
        })
      );
    }
    return map;
  }, [
    displayScene.tokens,
    isRoomGm,
    roomSettings.showMonsterHpToPlayers,
    hoverTokenId,
    hoverTargetId,
    session,
    roomActors,
    roomOwnerId,
  ]);

  const actorRacas = useMemo(() => {
    const out: Record<string, string | undefined> = {};
    if (!snapshot?.actors) return out;
    for (const [id, a] of Object.entries(snapshot.actors)) {
      out[id] = a.identity?.raca;
    }
    return out;
  }, [snapshot?.actors]);

  const moveAnimRef = useRef<{ tokenId: string; q: number; r: number } | null>(null);
  const moveBusyRef = useRef(false);
  const appliedSceneRevisionRef = useRef(0);
  const combatFxIdRef = useRef<string | null>(null);
  const combatFxQueueRef = useRef<CombatFxState[]>([]);
  const pendingCombatSnapRef = useRef<RoomSnapshot | null>(null);

  const syncRoom = useCallback(
    (snap?: RoomSnapshot) => {
      if (snap?.scene) {
        if (snap.revision > appliedSceneRevisionRef.current) {
          appliedSceneRevisionRef.current = snap.revision;
        }
        setScene(snap.scene);
        if (onApplySnapshot) onApplySnapshot(snap);
        else refresh();
      } else if (snap) {
        if (snap.revision > appliedSceneRevisionRef.current) {
          appliedSceneRevisionRef.current = snap.revision;
        }
        if (onApplySnapshot) onApplySnapshot(snap);
        else refresh();
      } else {
        refresh();
      }
    },
    [onApplySnapshot, refresh]
  );

  const battlefieldView = useBattlefieldView({ wrapRef, canvasRef });
  const canvasWrapSize = useCanvasWrapSize(wrapRef);

  const displayGridCells = useMemo(
    () =>
      buildDisplayHexGrid(
        canvasScene.gridRadius,
        canvasWrapSize.w,
        canvasWrapSize.h,
        canvasScene.hexSize,
        battlefieldView.view.scale
      ),
    [
      canvasScene.gridRadius,
      canvasScene.hexSize,
      canvasWrapSize.w,
      canvasWrapSize.h,
      battlefieldView.view.scale,
    ]
  );

  const mapBackdropToneValue = useMemo(() => {
    if (!mapImage?.complete || mapImage.naturalWidth < 1) return "none" as const;
    return mapBackdropTone(
      true,
      sampleImageLuminance(mapImage),
      sampleImageGreenDominance(mapImage)
    );
  }, [mapImage, mapImgTick]);

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
    channelExtraPa,
    turn,
  });

  const attackTargetPreview = useMemo(() => {
    if (
      !selected ||
      !activeCombatAction ||
      !hoverTargetId ||
      !isTargetMode(actionMode) ||
      highlights.isAreaSpellMode
    ) {
      return null;
    }
    const defender = displayScene.tokens.find((t) => t.id === hoverTargetId);
    if (!defender) return null;
    const defenderActor =
      defender.linked && defender.actorId
        ? snapshot?.actors[defender.actorId] ?? null
        : null;
    return estimateTargetCombatPreview(
      selected,
      defender,
      selectedActor,
      defenderActor,
      activeCombatAction,
      displayScene.tokens
    );
  }, [
    selected,
    activeCombatAction,
    hoverTargetId,
    actionMode,
    highlights.isAreaSpellMode,
    displayScene.tokens,
    selectedActor,
    snapshot?.actors,
  ]);

  const onFloorDrag = useCallback((offsetX: number, offsetY: number) => {
    setFloorPreview((prev) => ({
      mapImageScale: prev?.mapImageScale ?? canvasScene.mapImageScale ?? 1,
      mapImageOffsetX: offsetX,
      mapImageOffsetY: offsetY,
    }));
  }, [canvasScene.mapImageScale]);

  const onFloorResize = useCallback((scale: number, offsetX: number, offsetY: number) => {
    setFloorPreview({
      mapImageScale: scale,
      mapImageOffsetX: offsetX,
      mapImageOffsetY: offsetY,
    });
  }, []);

  const floorPreviewRef = useRef(floorPreview);
  floorPreviewRef.current = floorPreview;

  const commitFloorPreview = useCallback(async () => {
    const preview = floorPreviewRef.current;
    if (!preview) return;
    try {
      const snap = await patchRoomScene(roomId, {
        mapImageScale: preview.mapImageScale ?? displayScene.mapImageScale ?? 1,
        mapImageOffsetX: preview.mapImageOffsetX ?? displayScene.mapImageOffsetX ?? 0,
        mapImageOffsetY: preview.mapImageOffsetY ?? displayScene.mapImageOffsetY ?? 0,
      });
      if (snap) syncRoom(snap);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Erro ao salvar piso");
    }
  }, [displayScene.mapImageScale, displayScene.mapImageOffsetX, displayScene.mapImageOffsetY, roomId, syncRoom]);

  const onFloorDragEnd = useCallback(() => {
    void commitFloorPreview();
  }, [commitFloorPreview]);

  const canvasState: HexCanvasDrawState = useMemo(
    () => ({
      scene: canvasScene,
      gridCells: displayGridCells,
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
      attackTargetPreview,
      hoverTurnMoveTokenId: highlights.turnMovePreview ? hoverTokenId : null,
      tokenFlash,
      tokenCastFx,
      castFxNowMs: Date.now(),
      visibleHexSet,
      pings: displayPings,
      mapImage,
      mapBackdropTone: mapBackdropToneValue,
      tokenHpDisplay,
      dungeonEditorActive: dungeonMapEditing,
      floorEditActive: floorMapEditing,
      dungeonEditorTool:
        dungeonTool === "wall" || dungeonTool === "object" ? dungeonTool : null,
      selectedDungeonObjectId,
      mapMarkups: displayMarkups,
      markupPreview,
      selectedMarkupId,
    }),
    [
      canvasScene,
      displayGridCells,
      mapBackdropToneValue,
      displayMarkups,
      markupPreview,
      selectedMarkupId,
      highlights,
      actionMode,
      hoverAxial,
      spawnDragActive,
      canControlCombat,
      focusByTokenId,
      selectedId,
      turnActiveId,
      hoverTargetId,
      attackTargetPreview,
      hoverTokenId,
      tokenFlash,
      tokenCastFx,
      castFxTick,
      visibleHexSet,
      displayPings,
      mapImage,
      tokenHpDisplay,
      dungeonMapEditing,
      floorMapEditing,
      dungeonTool,
      selectedDungeonObjectId,
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
    if (floorPreview) redraw();
  }, [floorPreview, redraw]);

  const enqueueCombatFxFromChat = useCallback(
    (chat: ChatMessage[], tokens: BattleToken[]) => {
      const newMsgs = chat.filter(
        (m) => m.kind === "combat" && m.combat && !seenCombatRef.current.has(m.id)
      );
      if (!newMsgs.length) return;
      const { sequence, markSeen } = ingestNewCombatFx(newMsgs, seenCombatRef.current, tokens, {
        deferStateApplyForToken: () => true,
      });
      for (const id of markSeen) seenCombatRef.current.add(id);
      if (!sequence.length) return;
      combatFxQueueRef.current.push(...sequence);
      if (!combatFx) {
        const next = combatFxQueueRef.current.shift() ?? null;
        combatFxIdRef.current = next?.id ?? null;
        setCombatFx(next);
      }
    },
    [combatFx]
  );

  const playCombatFxFromSnap = useCallback(
    (snap: RoomSnapshot, opts?: { deferSnap?: boolean }) => {
      if (opts?.deferSnap) pendingCombatSnapRef.current = snap;
      enqueueCombatFxFromChat(snap.chat, snap.scene.tokens);
    },
    [enqueueCombatFxFromChat]
  );

  useEffect(() => {
    if (!snapshot?.chat) return;
    if (!combatChatSeededRef.current) {
      for (const msg of snapshot.chat) {
        if (msg.kind === "combat" && msg.combat) seenCombatRef.current.add(msg.id);
      }
      combatChatSeededRef.current = true;
      return;
    }
    enqueueCombatFxFromChat(snapshot.chat, snapshot.scene.tokens);
  }, [snapshot?.chat, snapshot?.scene.tokens, enqueueCombatFxFromChat]);

  useEffect(() => {
    appliedSceneRevisionRef.current = 0;
    combatChatSeededRef.current = false;
    seenCombatRef.current = new Set();
    combatFxQueueRef.current = [];
    combatFxIdRef.current = null;
    pendingCombatSnapRef.current = null;
    setCombatFx(null);
    setTokenFlash(null);
  }, [roomId]);

  useEffect(() => {
    if (!snapshot) return;
    if (snapshot.revision <= appliedSceneRevisionRef.current) return;

    const pendingFx = snapshot.chat.some(
      (m) => isPlayableCombatFxMessage(m) && !seenCombatRef.current.has(m.id)
    );
    if (pendingFx || combatFx !== null || combatFxQueueRef.current.length > 0) {
      pendingCombatSnapRef.current = snapshot;
      return;
    }

    appliedSceneRevisionRef.current = snapshot.revision;
    setScene(snapshot.scene);
  }, [snapshot, combatFx]);

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
    if (!turn.bypassTurn) {
      setActionMode("idle");
      setSelectedCombatAction(null);
    }
  }, [selectedId, snapshot?.combat?.activeIndex, snapshot?.combat?.round, turn.bypassTurn]);

  const removeSelectedToken = useCallback(async () => {
    if (!canControlCombat || !selectedId || !selected) return;
    setActionErr(null);
    try {
      const snap = await deleteRoomToken(roomId, selectedId);
      syncRoom(snap);
      const nextId = snap.scene.tokens[0]?.id ?? null;
      setSelectedId(nextId);
      setActionRingAt(null);
      toast.push(`${selected.name} removido do mapa`, "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao remover token";
      setActionErr(msg);
      toast.push(msg, "warn");
    }
  }, [canControlCombat, selectedId, selected, roomId, syncRoom, toast]);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
    }

    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;

      if (e.key === "Delete") {
        if (canControlCombat && selectedId && actionMode === "idle" && !actionRingAt) {
          e.preventDefault();
          void removeSelectedToken();
        }
        return;
      }

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
  }, [
    actionRingAt,
    actionMode,
    canControlCombat,
    selectedId,
    removeSelectedToken,
  ]);

  const onCombatApplyState = useCallback(() => {
    const snap = pendingCombatSnapRef.current;
    if (!snap) return;
    pendingCombatSnapRef.current = null;
    appliedSceneRevisionRef.current = snap.revision;
    setScene(snap.scene);
    syncRoom(snap);
  }, [syncRoom]);

  const onCombatFxDone = useCallback(() => {
    setTokenFlash(null);
    if (pendingCombatSnapRef.current) {
      const snap = pendingCombatSnapRef.current;
      pendingCombatSnapRef.current = null;
      appliedSceneRevisionRef.current = snap.revision;
      setScene(snap.scene);
      syncRoom(snap);
    }
    const next = combatFxQueueRef.current.shift() ?? null;
    combatFxIdRef.current = next?.id ?? null;
    setCombatFx(next);
  }, [syncRoom]);

  const onCombatTokenFlash = useCallback((tokenId: string | null, kind: import("@/lib/vtt/draw-battlefield").TokenFlashKind | null) => {
    if (tokenId && kind) setTokenFlash({ tokenId, kind });
    else setTokenFlash(null);
  }, []);

  const onTokenCastFx = useCallback((tokenId: string, kind: TokenCastFxKind) => {
    const startedAt = Date.now();
    setTokenCastFx((prev) => [
      ...prev.filter((fx) => !(fx.tokenId === tokenId && fx.kind === kind)),
      {
        id: `castfx-${tokenId}-${startedAt}`,
        tokenId,
        kind,
        startedAt,
        durationMs: castFxDuration(kind),
      },
    ]);
    setCastFxTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!tokenCastFx.length) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      setTokenCastFx((prev) => {
        const next = prev.filter((fx) => now - fx.startedAt < fx.durationMs);
        return next.length === prev.length ? prev : next;
      });
      setCastFxTick((n) => n + 1);
    }, 50);
    return () => window.clearInterval(id);
  }, [tokenCastFx.length]);

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
        playCombatFxFromSnap(snap, { deferSnap: true });
        setActionMode("idle");
        setAreaCenter(null);
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Falha na magia de área");
      }
    },
    [selected, activeCombatAction, roomId, turn.bypassTurn, channelExtraPa, syncRoom, playCombatFxFromSnap]
  );

  const actionPreview: ActionPreview | null = useMemo(() => {
    if (!selected) return null;
    if (highlights.showMovement && hoverAxial) {
      const movePaOpts = {
        ...(selectedActor
          ? { freeBasicMovePa: paTurnRulesForActor(selectedActor).freeBasicMovePa }
          : {}),
        ...(turn.bypassTurn ? { gmBypass: true as const } : {}),
      };
      const moveCtx: MovementPathContext = {
        tokens: displayScene.tokens,
        gridRadius: displayScene.gridRadius,
        actorRacas,
        dungeonObjects: displayScene.dungeonObjects,
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
      const center = highlights.needsAreaDirection ? selected.axial : hoverAxial;
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
        const defenderActor =
          defender.linked && defender.actorId
            ? snapshot?.actors[defender.actorId] ?? null
            : null;
        return previewAttackOnTarget(
          selected,
          defender,
          selectedActor,
          activeCombatAction,
          displayScene.tokens,
          turn,
          channelExtraPa,
          defenderActor
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
    snapshot?.actors,
  ]);

  const actionPreviewAnchor = useMemo(() => {
    if (
      !hoverTargetId ||
      !activeCombatAction ||
      !isTargetMode(actionMode) ||
      highlights.isAreaSpellMode
    ) {
      return null;
    }
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const defender = displayScene.tokens.find((t) => t.id === hoverTargetId);
    if (!defender) return null;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const { ox, oy } = canvasCenter(w, h);
    const world = axialToPixel(
      defender.axial.q,
      defender.axial.r,
      displayScene.hexSize,
      ox,
      oy
    );
    return worldToScreen(world.x, world.y, w, h, battlefieldView.view);
  }, [
    hoverTargetId,
    activeCombatAction,
    actionMode,
    highlights.isAreaSpellMode,
    displayScene.tokens,
    displayScene.hexSize,
    battlefieldView.view,
  ]);

  const fireSelfAbility = useCallback(
    async (action: CombatActionOption, token = selected) => {
      if (!token || !action.selfTarget || action.kind !== "ability") return;
      setActionErr(null);
      try {
        const snap = await postRoomAbility(roomId, token.id, null, {
          actionEntryId: action.entryId,
          bypassTurn: turn.bypassTurn,
        });
        playCombatFxFromSnap(snap, { deferSnap: true });
        setActionMode("idle");
        setSelectedCombatAction(null);
        setActionRingAt(null);
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Falha na habilidade");
      }
    },
    [selected, roomId, turn.bypassTurn, syncRoom, playCombatFxFromSnap]
  );

  const attackToken = useCallback(
    async (defenderId: string) => {
      if (!selected || !activeCombatAction) return;
      if (activeCombatAction.areaShape && activeCombatAction.areaShape !== "single") {
        setActionErr("Magia de área: clique o centro da área no mapa (não um alvo único).");
        return;
      }
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
        playCombatFxFromSnap(snap, { deferSnap: true });
        setActionMode("idle");
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Falha no ataque");
      }
    },
    [
      selected,
      activeCombatAction,
      roomId,
      turn.bypassTurn,
      channelExtraPa,
      syncRoom,
      playCombatFxFromSnap,
    ]
  );

  const moveSelectedTo = useCallback(
    async (axial: Axial) => {
      if (!selected || !isMoveMode(actionMode) || moveBusyRef.current) return;
      if (turn.activeTokenId && selected.id !== turn.activeTokenId && !turn.bypassTurn) {
        setActionErr("Aguarde seu turno na iniciativa");
        return;
      }
      const moveCtx: MovementPathContext = {
        tokens: displayScene.tokens,
        gridRadius: displayScene.gridRadius,
        actorRacas,
        dungeonObjects: displayScene.dungeonObjects,
      };
      const movePaOpts = {
        ...(selectedActor?.identity
          ? { freeBasicMovePa: paTurnRulesForActor(selectedActor).freeBasicMovePa }
          : {}),
        ...(turn.bypassTurn ? { gmBypass: true as const } : {}),
      };
      const check = canMoveToken(selected, axial, highlights.moveMode, moveCtx, movePaOpts);
      if (!check.ok) {
        setActionErr(check.reason ?? "Movimento inválido");
        return;
      }
      setActionErr(null);
      moveBusyRef.current = true;
      const origin = selected.axial;
      const path = check.path ?? [origin, axial];
      try {
        const snap = await moveRoomTokenBudget(
          roomId,
          selected.id,
          axial.q,
          axial.r,
          highlights.moveMode,
          turn.bypassTurn
        );
        if (!snap?.scene) throw new Error("Resposta inválida ao mover token");
        syncRoom(snap);
        moveAnimRef.current = { tokenId: selected.id, q: origin.q, r: origin.r };
        redraw();
        await animateTokenAlongPath(path, (step) => {
          moveAnimRef.current = { tokenId: selected.id, q: step.q, r: step.r };
          redraw();
        });
        moveAnimRef.current = null;
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
      selectedActor,
      actionMode,
      roomId,
      highlights.moveMode,
      turn.activeTokenId,
      turn.bypassTurn,
      syncRoom,
      redraw,
      displayScene.tokens,
      displayScene.gridRadius,
      displayScene.dungeonObjects,
      actorRacas,
    ]
  );

  const canRepositionToken = useCallback(
    (token: BattleToken) =>
      canControlCombat ||
      (Boolean(canControlToken?.(token)) && !token.monsterEntryId),
    [canControlCombat, canControlToken]
  );

  const onRepositionToken = useCallback(
    async (tokenId: string, axial: Axial) => {
      setActionErr(null);
      try {
        const snap = await repositionRoomToken(roomId, tokenId, axial.q, axial.r);
        if (!snap?.scene) throw new Error("Resposta inválida ao mover token");
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

  const onDungeonHexEdit = useCallback(
    async (axial: Axial, dragObjectId?: string) => {
      if (!dungeonMapEditing) return;
      setActionErr(null);
      try {
        const result = await applyDungeonHexEdit(
          roomId,
          displayScene,
          dungeonTool,
          axial,
          dragObjectId ?? selectedDungeonObjectId
        );
        if (result.error) {
          setActionErr(result.error);
        }
        if (result.selectedId !== undefined) {
          setSelectedDungeonObjectId(result.selectedId);
        }
        if (result.snapshot) {
          syncRoom(result.snapshot);
        }
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Falha ao editar mapa");
      }
    },
    [
      dungeonMapEditing,
      roomId,
      displayScene,
      dungeonTool,
      selectedDungeonObjectId,
      syncRoom,
    ]
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

  const persistMapMarkups = useCallback(
    async (next: MapMarkup[]) => {
      setActionErr(null);
      try {
        const snap = await patchRoomScene(roomId, { mapMarkups: next });
        syncRoom(snap);
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Falha ao salvar lousa");
      }
    },
    [roomId, syncRoom]
  );

  const createWhiteboardMarkup = useCallback(
    (kind: MapMarkup["kind"], points: { x: number; y: number }[], text?: string) =>
      createMapMarkup({
        kind,
        durability: canManageMarkups ? markupDurability : "temporary",
        color: markupColor,
        width: markupWidth,
        points,
        text,
        author: mapMarkupAuthorId(session),
      }),
    [markupColor, markupDurability, markupWidth, session, canManageMarkups]
  );

  const onMarkupCommit = useCallback(
    (markup: MapMarkup) => {
      void persistMapMarkups(appendMapMarkup(mapMarkupsOf(displayScene), markup));
    },
    [displayScene, persistMapMarkups]
  );

  const onMarkupMoveCommit = useCallback(
    (id: string, dx: number, dy: number) => {
      void persistMapMarkups(moveMapMarkup(mapMarkupsOf(displayScene), id, dx, dy));
    },
    [displayScene, persistMapMarkups]
  );

  const onMarkupErase = useCallback(
    (id: string) => {
      const target = mapMarkupsOf(displayScene).find((m) => m.id === id);
      if (
        target &&
        !canDeleteMapMarkup(target, { ownerId: roomOwnerId }, session)
      ) {
        setActionErr("Só pode apagar os seus próprios desenhos.");
        return;
      }
      void persistMapMarkups(removeMapMarkup(mapMarkupsOf(displayScene), id));
      setSelectedMarkupId((cur) => (cur === id ? null : cur));
    },
    [displayScene, persistMapMarkups, roomOwnerId, session]
  );

  const onMarkupTextRequest = useCallback(
    (wx: number, wy: number) => {
      const text = window.prompt("Texto da marcação:");
      if (!text?.trim()) return;
      onMarkupCommit(
        createWhiteboardMarkup("text", [{ x: wx, y: wy }], text.trim())
      );
    },
    [createWhiteboardMarkup, onMarkupCommit]
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
    selectedActor,
    channelExtraPa,
    turn,
    canControlCombat,
    canRepositionToken,
    onRepositionToken: (id, a) => void onRepositionToken(id, a),
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
    dungeonEditor: isRoomGm
      ? {
          layer: dungeonLayer,
          active:
            !whiteboardActive &&
            (dungeonLayer === "floor"
              ? floorMapEditing
              : dungeonEditorActive),
          tool: dungeonTool,
          selectedObjectId: selectedDungeonObjectId,
          onSelectObject: setSelectedDungeonObjectId,
          onHexEdit: (a, dragId) => void onDungeonHexEdit(a, dragId),
          floorOffsetX: canvasScene.mapImageOffsetX ?? 0,
          floorOffsetY: canvasScene.mapImageOffsetY ?? 0,
          floorScale: canvasScene.mapImageScale ?? 1,
          mapImage: mapImage,
          onFloorDrag: floorMapEditing ? onFloorDrag : undefined,
          onFloorResize: floorMapEditing ? onFloorResize : undefined,
          onFloorDragEnd: floorMapEditing ? () => void onFloorDragEnd() : undefined,
        }
      : undefined,
    whiteboard: canUseWhiteboard
      ? {
          active: whiteboardActive,
          tool: whiteboardTool,
          markups: displayMarkups,
          selectedId: selectedMarkupId,
          hitTest: (wx, wy) => hitTestMapMarkup(displayMarkups, wx, wy),
          onSelect: setSelectedMarkupId,
          onPreview: setMarkupPreview,
          onCommit: onMarkupCommit,
          onMoveCommit: onMarkupMoveCommit,
          onErase: onMarkupErase,
          createMarkup: createWhiteboardMarkup,
          onTextRequest: onMarkupTextRequest,
        }
      : undefined,
  });

  useEffect(() => {
    if (!whiteboardActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const t = e.target as HTMLElement | null;
        if (t?.closest("input, textarea, select, [contenteditable]")) return;
        if (!selectedMarkupId) return;
        e.preventDefault();
        onMarkupErase(selectedMarkupId);
      }
      if (e.key === "Escape") {
        pointer.cancelWhiteboardDraft();
        setSelectedMarkupId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [whiteboardActive, selectedMarkupId, onMarkupErase, pointer.cancelWhiteboardDraft]);

  const clearSessionMarkups = useCallback(() => {
    const next = mapMarkupsOf(displayScene).filter((m) => m.durability !== "temporary");
    void persistMapMarkups(next);
  }, [displayScene, persistMapMarkups]);

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
      allSceneTokens={displayScene.tokens}
      roomActors={roomActors}
      session={session}
      adventureId={adventureIdProp ?? roomId}
      spawnAxial={hoverAxial}
      selectedId={selectedId}
      onSelect={setSelectedId}
      selected={selected}
      combat={combat}
      canViewTokenPa={canViewTokenPaFn}
      canUseToken={Boolean(canUseToken)}
      canControlCombat={canControlCombat}
      canApplyConditions={isRoomGm}
      showMovementLegend={Boolean(selected && highlights.showMovement)}
      actionMode={actionMode}
      actionErr={actionErr}
      roomId={roomId}
      onOpenSheet={onOpenSheet}
      onPlaced={(snap) => syncRoom(snap)}
      onUpdate={refresh}
      fogHint={fogListHint}
    />
  );

  const gmToolsPanel =
    canControlCombat && snapshot ? (
      <GmToolsPanel
        roomId={roomId}
        scene={displayScene}
        snapshot={snapshot}
        inviteCode={inviteCode}
        roomActors={roomActors}
        spawnAxial={hoverAxial}
        onSceneUpdated={(snap) => syncRoom(snap)}
      />
    ) : null;

  const whiteboardPanel =
    canUseWhiteboard && snapshot ? (
      <WhiteboardPanel
        roomId={roomId}
        scene={displayScene}
        active={whiteboardActive}
        tool={whiteboardTool}
        color={markupColor}
        width={markupWidth}
        durability={markupDurability}
        markupCount={displayMarkups.length}
        tempCount={tempMarkupCount}
        canManageAll={canManageMarkups}
        onActiveChange={(active) => {
          setWhiteboardActive(active);
          if (active) {
            setDungeonEditorActive(false);
            setMarkupPreview(null);
          }
        }}
        onToolChange={setWhiteboardTool}
        onColorChange={setMarkupColor}
        onWidthChange={setMarkupWidth}
        onDurabilityChange={(d) => {
          if (d === "permanent" && !canManageMarkups) return;
          setMarkupDurability(d);
        }}
        onUpdated={(snap) => syncRoom(snap)}
      />
    ) : null;

  const dungeonPanel =
    isRoomGm && snapshot ? (
      <DungeonEditorPanel
        id="vtt-dungeon-editor"
        roomId={roomId}
        scene={displayScene}
        layer={dungeonLayer}
        modeOpen={dungeonModeOpen}
        active={dungeonEditorActive}
        tool={dungeonTool}
        selectedObjectId={selectedDungeonObjectId}
        onLayerChange={(layer) => {
          setDungeonLayer(layer);
          if (layer === "floor" && hasFloorImage) {
            setDungeonEditorActive(true);
          } else if (layer === "objects") {
            setDungeonEditorActive(false);
          } else if (layer !== "floor") {
            setDungeonEditorActive(false);
          }
        }}
        onActiveChange={setDungeonEditorActive}
        onToolChange={setDungeonTool}
        onSelectedObjectChange={setSelectedDungeonObjectId}
        onUpdated={(snap) => syncRoom(snap)}
      />
    ) : null;

  const legacySidebar = (
    <>
      {actorsPanel}
      {gmToolsPanel}
      {dungeonPanel}
      {canControlCombat && showSpawnInSidebar ? (
        <MonsterSpawnPanel roomId={roomId} spawnAxial={hoverAxial} onSpawned={(snap) => syncRoom(snap)} />
      ) : null}
    </>
  );

  const [dockRoot, setDockRoot] = useState<HTMLElement | null>(null);
  const [hudRoot, setHudRoot] = useState<HTMLElement | null>(null);
  const resolveDockRoot = useCallback(() => document.getElementById("foundry-sidebar-dock"), []);
  const resolveHudRoot = useCallback(() => document.getElementById("foundry-mesa-windows"), []);

  useLayoutEffect(() => {
    setDockRoot(resolveDockRoot());
    setHudRoot(resolveHudRoot());
  }, [resolveDockRoot, resolveHudRoot]);

  useEffect(() => {
    if (dockRoot && hudRoot) return;
    const id = window.requestAnimationFrame(() => {
      setDockRoot(resolveDockRoot());
      setHudRoot(resolveHudRoot());
    });
    return () => window.cancelAnimationFrame(id);
  }, [dockRoot, hudRoot, resolveDockRoot, resolveHudRoot]);

  const dockTarget = dockRoot;
  const float = (id: MesaWindowId) => Boolean(isWindowFloating?.(id));

  const portalPanel = (node: ReactNode, floating: boolean) => {
    if (!node) return null;
    const target = floating ? hudRoot : dockTarget;
    return target ? createPortal(node, target) : node;
  };

  const actorsBody = (
    <div className="mesa-panel-scroll mesa-panel-scroll--rail">{actorsPanel}</div>
  );

  const actorsUi =
    foundryLayout && actorsWindowLayout ? (
      float("actors") ? (
        <FoundryWindow
          title="Personagens"
          layout={actorsWindowLayout}
          className="foundry-window--actors"
          onLayoutChange={onActorsWindowLayoutChange ?? (() => {})}
          onClose={onActorsWindowClose ?? (() => {})}
          onMinimize={onActorsWindowMinimize ?? (() => {})}
          onFocus={onActorsWindowFocus ?? (() => {})}
        >
          {actorsBody}
        </FoundryWindow>
      ) : (
        <FoundryDockPanel
          title="Personagens"
          open={actorsWindowLayout.open}
          minimized={actorsWindowLayout.minimized}
          className="foundry-dock-panel--actors"
          onClose={onActorsWindowClose ?? (() => {})}
          onMinimize={onActorsWindowMinimize}
        >
          {actorsBody}
        </FoundryDockPanel>
      )
    ) : null;

  const actorsPortal = portalPanel(actorsUi, float("actors"));

  const gmBody = (
    <div className="mesa-panel-scroll mesa-panel-scroll--rail">{gmToolsPanel}</div>
  );

  const gmUi =
    foundryLayout && canControlCombat && gmWindowLayout && gmToolsPanel ? (
      float("gm") ? (
        <FoundryWindow
          title="Ferramentas do mestre"
          layout={gmWindowLayout}
          className="foundry-window--gm"
          onLayoutChange={onGmWindowLayoutChange ?? (() => {})}
          onClose={onGmWindowClose ?? (() => {})}
          onMinimize={onGmWindowMinimize ?? (() => {})}
          onFocus={onGmWindowFocus ?? (() => {})}
        >
          {gmBody}
        </FoundryWindow>
      ) : (
        <FoundryDockPanel
          title="Ferramentas do mestre"
          open={gmWindowLayout.open}
          minimized={gmWindowLayout.minimized}
          className="foundry-dock-panel--gm"
          onClose={onGmWindowClose ?? (() => {})}
          onMinimize={onGmWindowMinimize}
        >
          {gmBody}
        </FoundryDockPanel>
      )
    ) : null;

  const gmPortal = portalPanel(gmUi, float("gm"));

  const dungeonBody = (
    <div className="mesa-panel-scroll mesa-panel-scroll--rail">{dungeonPanel}</div>
  );

  const dungeonUi =
    foundryLayout && dungeonWindowLayout && dungeonPanel ? (
      float("dungeon") ? (
        <FoundryWindow
          title="Editor de mapa"
          layout={dungeonWindowLayout}
          className="foundry-window--dungeon"
          minWidth={280}
          minHeight={280}
          onLayoutChange={onDungeonWindowLayoutChange ?? (() => {})}
          onClose={onDungeonWindowClose ?? (() => {})}
          onMinimize={onDungeonWindowMinimize ?? (() => {})}
          onFocus={onDungeonWindowFocus ?? (() => {})}
        >
          {dungeonBody}
        </FoundryWindow>
      ) : (
        <FoundryDockPanel
          title="Editor de mapa"
          open={dungeonWindowLayout.open}
          minimized={dungeonWindowLayout.minimized}
          className="foundry-dock-panel--dungeon"
          onClose={onDungeonWindowClose ?? (() => {})}
          onMinimize={onDungeonWindowMinimize}
        >
          {dungeonBody}
        </FoundryDockPanel>
      )
    ) : null;

  const dungeonPortal = portalPanel(dungeonUi, float("dungeon"));

  const whiteboardBody = (
    <div className="mesa-panel-scroll mesa-panel-scroll--rail">{whiteboardPanel}</div>
  );

  const whiteboardUi =
    foundryLayout && whiteboardWindowLayout && whiteboardPanel ? (
      float("whiteboard") ? (
        <FoundryWindow
          title="Lousa do mapa"
          layout={whiteboardWindowLayout}
          className="foundry-window--whiteboard"
          minHeight={200}
          onLayoutChange={onWhiteboardWindowLayoutChange ?? (() => {})}
          onClose={onWhiteboardWindowClose ?? (() => {})}
          onMinimize={onWhiteboardWindowMinimize ?? (() => {})}
          onFocus={onWhiteboardWindowFocus ?? (() => {})}
        >
          {whiteboardBody}
        </FoundryWindow>
      ) : (
        <FoundryDockPanel
          title="Lousa do mapa"
          open={whiteboardWindowLayout.open}
          minimized={whiteboardWindowLayout.minimized}
          className="foundry-dock-panel--whiteboard"
          onClose={onWhiteboardWindowClose ?? (() => {})}
          onMinimize={onWhiteboardWindowMinimize}
        >
          {whiteboardBody}
        </FoundryDockPanel>
      )
    ) : null;

  const whiteboardPortal = portalPanel(whiteboardUi, float("whiteboard"));

  const initiativeUi =
    foundryLayout && initiativeWindowLayout && combat ? (
      (() => {
        const initiativeBody = (
          <div className="mesa-panel-scroll mesa-panel-scroll--rail">
            <TurnOrderPanel
              roomId={roomId}
              combat={combat}
              tokens={listTokens}
              canControl={canControlCombat}
              canEndTurn={canEndTurnProp}
              combatUndo={snapshot?.combatUndo}
              onSnapshot={syncRoom}
              onUpdate={refresh}
              attackableIds={highlights.attackableIds}
              hoverAttackTargetId={hoverTargetId}
              onHoverAttackTargetChange={setHoverTargetId}
            />
          </div>
        );
        return float("initiative") ? (
          <FoundryWindow
            title="Ordem de turno"
            layout={initiativeWindowLayout}
            className="foundry-window--initiative"
            minHeight={200}
            onLayoutChange={onInitiativeWindowLayoutChange ?? (() => {})}
            onClose={onInitiativeWindowClose ?? (() => {})}
            onMinimize={onInitiativeWindowMinimize ?? (() => {})}
            onFocus={onInitiativeWindowFocus ?? (() => {})}
          >
            {initiativeBody}
          </FoundryWindow>
        ) : (
          <FoundryDockPanel
            title="Ordem de turno"
            open={initiativeWindowLayout.open}
            minimized={initiativeWindowLayout.minimized}
            className="foundry-dock-panel--initiative"
            onClose={onInitiativeWindowClose ?? (() => {})}
            onMinimize={onInitiativeWindowMinimize}
          >
            {initiativeBody}
          </FoundryDockPanel>
        );
      })()
    ) : null;

  const initiativePortal = portalPanel(initiativeUi, float("initiative"));

  return (
    <div
      className={`vtt-shell${foundryLayout ? " vtt-shell--foundry" : ""}`}
      style={shellStyle}
    >
      {foundryLayout ? actorsPortal : null}
      {foundryLayout ? gmPortal : null}
      {foundryLayout ? dungeonPortal : null}
      {foundryLayout ? whiteboardPortal : null}
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
        onWheel={(e) => {
          battlefieldView.onWheel(e);
        }}
        {...spawnDropHandlers}
      >
        <VttHelpButton />
        {canUseWhiteboard ? (
          <DrawingToolbar
            active={whiteboardActive}
            tool={whiteboardTool}
            color={markupColor}
            width={markupWidth}
            canManageAll={canManageMarkups}
            onActiveChange={(active) => {
              setWhiteboardActive(active);
              if (active) {
                setDungeonEditorActive(false);
                setMarkupPreview(null);
              }
            }}
            onToolChange={setWhiteboardTool}
            onColorChange={setMarkupColor}
            onWidthChange={setMarkupWidth}
            onClearSession={clearSessionMarkups}
          />
        ) : null}
        <BattlefieldViewControls
          zoomPercent={battlefieldView.zoomPercent}
          canZoomIn={battlefieldView.canZoomIn}
          canZoomOut={battlefieldView.canZoomOut}
          onZoomIn={battlefieldView.zoomIn}
          onZoomOut={battlefieldView.zoomOut}
          onReset={battlefieldView.resetView}
          showDungeonEditor={isRoomGm}
          dungeonEditorActive={dungeonModeOpen || dungeonMapEditing}
          onToggleDungeonEditor={() => {
            setDungeonModeOpen((open) => {
              if (!open) {
                setDungeonLayer("floor");
                setDungeonEditorActive(hasFloorImage);
                onOpenDungeonPanel?.();
              } else {
                setDungeonEditorActive(false);
              }
              return !open;
            });
          }}
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
            allTokens={snapshot?.scene.tokens ?? []}
            actor={selectedActor}
            combat={snapshot?.combat}
            canBypassTurn={canBypassTurnProp}
            roomId={roomId}
            onPickMode={(mode, action) => {
              if (action?.selfTarget && action.kind === "ability") {
                void fireSelfAbility(action);
                return;
              }
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
            onSnapshot={syncRoom}
            onUpdate={refresh}
          />
        ) : null}
        <BattlefieldActionHud preview={actionPreview} anchor={actionPreviewAnchor} />
        <CombatFxLayer
          wrapRef={wrapRef}
          hexSize={scene.hexSize}
          fx={combatFx}
          view={battlefieldView.view}
          onApplyState={onCombatApplyState}
          onTokenFlash={onCombatTokenFlash}
          onTokenCastFx={onTokenCastFx}
          onDone={onCombatFxDone}
        />
      </div>
    </div>
  );
}
