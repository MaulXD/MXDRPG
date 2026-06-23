"use client";

import dynamic from "next/dynamic";
import {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { Axial } from "@/lib/vtt/grid-math";
import type { BattleScene, BattleToken, MapMarkup, MapMarkupDurability } from "@/lib/vtt/types";
import {
  moveRoomTokenBudget,
  patchRoomScene,
  postRoomAttack,
  postRoomAbility,
  postRoomAreaSpell,
  postRoomPing,
  revealRoomCell,
  repositionRoomToken,
  deleteRoomToken,
  applyRoomApiPayload,
  type RoomApiPayload,
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
import { filterTokensForFog, visibleCellSetForPlayer } from "@/lib/vtt/fog-of-war";
import { resolveTokenHpDisplay } from "@/lib/vtt/token-hp-display";
import { shouldIgnoreBattlefieldShortcut } from "@/lib/vtt/keyboard-guard";
import { GmToolsPanel } from "@/components/vtt/GmToolsPanel";
import { MapTokenList } from "@/components/vtt/MapTokenList";
import { DungeonEditorPanel } from "@/components/vtt/DungeonEditorPanel";
import { FoundryDockPanel } from "@/components/vtt/foundry/FoundryDockPanel";
import type { RoomSnapshot } from "@/lib/room/types";
import { TokenActionRing } from "@/components/vtt/TokenActionRing";
import { SpellPickerPanel } from "@/components/vtt/SpellPickerPanel";
import { SpellChannelControl } from "@/components/vtt/SpellChannelControl";
import { MonsterSpawnPanel } from "@/components/vtt/MonsterSpawnPanel";
import type { MapToolMode, MeasurePreview } from "@/lib/vtt/map-toolbar";
import { MesaDockPanel } from "@/components/vtt/MesaDockPanel";
import { FoundryWindow } from "@/components/vtt/foundry/FoundryWindow";
import type { FoundryWindowLayout, MesaWindowId } from "@/hooks/vtt/useFoundryWindows";
import type { MesaPanelLayout } from "@/lib/vtt/mesa-panel-layout";
import { effectiveMesaPanelWidth } from "@/lib/vtt/mesa-panel-layout";
import type { TokenCombatFlash } from "@/components/vtt/CombatFxLayer";
import type { CombatFxState } from "@/lib/vtt/combat-fx-types";
import { ingestNewCombatFx, isPlayableCombatFxMessage, createPendingAttackFx, findPendingAttackMessage, isPendingCombatFx, resolvePendingCombatFx } from "@/lib/vtt/combat-fx-sequence";
import { isLiveCombatFxMessage } from "@/lib/vtt/combat-fx-live";
import type { ChatMessage } from "@/lib/room/chat";
import { emptyCombat, activeTokenId, normalizeCombatTrack } from "@/lib/room/combat";
import { resolveLivingActiveTokenId } from "@/lib/room/combat-order";
import { TurnHandoffOverlay } from "@/components/vtt/TurnHandoffOverlay";
import { useBattlefieldCombatFxQueue } from "@/hooks/vtt/useBattlefieldCombatFxQueue";
import { BattlefieldMapCanvas } from "@/components/vtt/battlefield/BattlefieldMapCanvas";
import { BattlefieldCombatFxHost } from "@/components/vtt/battlefield/BattlefieldCombatFxHost";

import {
  firstPortraitDataUrl,
  mergeScenePreservingPortraits,
  mergeTokenPortraitFields,
} from "@/lib/room/portrait-sync";
import { isMonsterToken } from "@/lib/room/settings";
import {
  canShowSheetInActionRing,
  resolveMonsterSheetOpenTarget,
} from "@/lib/vtt/monster-sheet-access";
import {
  listTokenCombatActions,
  combatAttackRequestOpts,
  canAttackTarget,
  needsFriendlyFireConfirm,
  resolveCombatAction,
} from "@/lib/combat/attack";
import { FriendlyFireConfirmDialog } from "@/components/vtt/FriendlyFireConfirmDialog";
import { DeleteTokenConfirmDialog } from "@/components/vtt/DeleteTokenConfirmDialog";
import { TokenGmHpDialog } from "@/components/vtt/TokenGmHpDialog";
import { SpellTargetConfirmBar } from "@/components/vtt/SpellTargetConfirmBar";
import { isMultiTargetSpell, spellTargetCount } from "@/lib/combat/spell-target-count";
import type { CombatActionOption } from "@/lib/combat/types";
import { isMoveMode, isTargetMode, type TokenActionMode } from "@/lib/vtt/action-mode";
import {
  previewAreaCast,
  previewAreaDirectionStep,
  previewAttackOnTarget,
  previewMoveFromCheck,
  type ActionPreview,
} from "@/lib/combat/action-preview";
import {
  castFxDuration,
  type ActiveTokenCastFx,
  type TokenCastFxKind,
} from "@/lib/vtt/token-cast-fx";
import { BattlefieldActionHud } from "@/components/vtt/BattlefieldActionHud";
import { CharacterCombatHud } from "@/components/vtt/CharacterCombatHud";
import { CombatHudRestoreButton } from "@/components/vtt/CombatHudRestoreButton";
import { MonsterKnowledgePanel } from "@/components/vtt/MonsterKnowledgePanel";
import { PlayerBestiaryGmPanel } from "@/components/vtt/PlayerBestiaryGmPanel";
import { TokenHoverMiniHud } from "@/components/vtt/TokenHoverMiniHud";
import { TokenStatusBody } from "@/components/vtt/TokenStatusBody";
import { EndTurnBar } from "@/components/vtt/EndTurnBar";
import { TurnOrderPanel } from "@/components/vtt/TurnOrderPanel";
import {
  applyDungeonCellEdit,
  type DungeonEditLayer,
  type DungeonEditorTool,
} from "@/components/vtt/DungeonEditorPanel";
import { useCombatTurn } from "@/hooks/useCombatActions";
import {
  canActOnCombatTurn,
  effectiveBypassTurn,
  TURN_WAIT_MSG,
} from "@/lib/combat/turn-guard";
import { isRoomClientError } from "@/lib/room/api-error";
import { useCombatHudVisible } from "@/hooks/vtt/useCombatHudVisible";
import { useTokenImages } from "@/hooks/vtt/useTokenImages";
import { usePortraitFocusByToken } from "@/hooks/vtt/usePortraitFocusByToken";
import { useBattlefieldHighlights } from "@/hooks/vtt/useBattlefieldHighlights";
import { useBattlefieldView } from "@/hooks/vtt/useBattlefieldView";
import { useCanvasWrapSize } from "@/hooks/vtt/useCanvasWrapSize";
import { useGridCanvas, type GridCanvasDrawState } from "@/hooks/vtt/useGridCanvas";
import {
  mapBackdropTone,
  sampleImageGreenDominance,
  sampleImageLuminance,
} from "@/lib/vtt/map-luminance";
import { useBattlefieldPointer } from "@/hooks/vtt/useBattlefieldPointer";
import { useMonsterSpawnDrop } from "@/hooks/vtt/useMonsterSpawnDrop";
import { creatureSizeOf, occupiedCells, tokenPixelCenter } from "@/lib/vtt/creature-size";
import { resolveMonsterSpawnPlacement } from "@/lib/vtt/spawn-placement";
import { getActiveSpawnDragPayload } from "@/lib/vtt/spawn-drag";
import { movementPaOptsForRoom } from "@/lib/combat/movement-pa-opts";
import { canMoveToken, type MovementPathContext } from "@/lib/vtt/movement";
import { animateTokenAlongPath } from "@/lib/vtt/token-move-animation";
import { axialToPixel, cellDrawRadius } from "@/lib/vtt/grid-math";
import { canvasCenter, worldToScreen } from "@/lib/vtt/battlefield-view";
import { resolveMapAlignedGridLayout } from "@/lib/vtt/grid-layout";
import "./vtt.css";

type Props = {
  scene: BattleScene;
  canEdit: boolean;
  canControlCombat?: boolean;
  /** Arrastar token livremente (sem PA/turno) — só mestre. */
  canRepositionTokens?: boolean;
  /** Desenhar na lousa — jogadores e mestre */
  canUseWhiteboard?: boolean;
  canBypassTurn?: boolean;
  canEndTurn?: boolean;
  canControlToken?: (token: import("@/lib/vtt/types").BattleToken) => boolean;
  canViewTokenPa?: (token: import("@/lib/vtt/types").BattleToken) => boolean;
  roomId?: string;
  roomOwnerId?: string;
  memberIds?: string[];
  adventureId?: string;
  inviteCode?: string | null;
  snapshot?: RoomSnapshot | null;
  onRefresh?: () => void;
  onApplySnapshot?: (payload: RoomApiPayload, opts?: { force?: boolean; immediate?: boolean }) => void;
  onOpenSheet?: (actorId?: string) => void;
  onCreateCharacter?: () => void;
  /** Abre ficha de monstro do compêndio em janela flutuante. */
  onOpenMonsterSheet?: (entryId: string) => void;
  onHoverAxialChange?: (axial: Axial | null) => void;
  onOpenDungeonPanel?: () => void;
  showSpawnInSidebar?: boolean;
  session?: import("@/lib/auth/types").SessionUser | null;
  roomActors?: Record<string, import("@/lib/room/types").RoomActor>;
  leftPanel?: MesaPanelLayout;
  onLeftPanelChange?: (patch: Partial<MesaPanelLayout>) => void;
  /** Mapa em tela cheia; tokens em janela flutuante (Foundry). */
  foundryLayout?: boolean;
  watchOnly?: boolean;
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
  /** Revelação em fases das mensagens de combate no chat (dado → dano). */
  onCombatChatReveal?: (messageIds: string[], phase: "roll" | "damage" | "done") => void;
  statusWindowLayout?: FoundryWindowLayout;
  onStatusWindowLayoutChange?: (patch: Partial<FoundryWindowLayout>) => void;
  onStatusWindowClose?: () => void;
  onStatusWindowMinimize?: () => void;
  onStatusWindowFocus?: () => void;
  /** Abre o painel Status na barra lateral (Foundry). */
  onStatusDockOpen?: () => void;
  isWindowFloating?: (id: MesaWindowId) => boolean;
  /** userId → apelido/nome para placa dual nos tokens. */
  ownerDisplayNames?: Map<string, string>;
  /** Quando definido, substitui a detecção interna de mestre (ex.: visão simulada de jogador). */
  isRoomGm?: boolean;
  /** Mestre simulando visão/controles de jogador na mesa. */
  simulatePlayerView?: boolean;
  /** Invocar monstros, reposicionar tokens — permanece ativo mesmo na visão jogador. */
  canManageBattlefield?: boolean;
};

export function Battlefield({
  scene: initial,
  canEdit,
  canControlCombat = false,
  canRepositionTokens = false,
  canUseWhiteboard = false,
  canBypassTurn: canBypassTurnProp = false,
  canEndTurn: canEndTurnProp = false,
  canControlToken,
  canViewTokenPa,
  roomId = "demo",
  roomOwnerId = "",
  memberIds = [],
  adventureId: adventureIdProp,
  inviteCode = null,
  snapshot = null,
  onRefresh,
  onApplySnapshot,
  onOpenSheet,
  onOpenMonsterSheet,
  onCreateCharacter,
  onHoverAxialChange,
  onOpenDungeonPanel,
  showSpawnInSidebar = true,
  session = null,
  roomActors = {},
  leftPanel,
  onLeftPanelChange,
  foundryLayout = false,
  watchOnly = false,
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
  onCombatChatReveal,
  statusWindowLayout,
  onStatusWindowLayoutChange,
  onStatusWindowClose,
  onStatusWindowMinimize,
  onStatusWindowFocus,
  onStatusDockOpen,
  isWindowFloating,
  ownerDisplayNames,
  isRoomGm: isRoomGmProp,
  simulatePlayerView = false,
  canManageBattlefield,
}: Props) {
  const battlefieldGm = canManageBattlefield ?? canControlCombat;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(
    initial.tokens?.[0]?.id ?? null
  );
  const [actionMode, setActionMode] = useState<TokenActionMode>("idle");
  const [selectedCombatAction, setSelectedCombatAction] = useState<CombatActionOption | null>(null);
  const [hoverAxial, setHoverAxial] = useState<Axial | null>(null);
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);
  const [hoverTokenId, setHoverTokenId] = useState<string | null>(null);
  const [hoverPointer, setHoverPointer] = useState<{ x: number; y: number } | null>(null);
  const [gmDragTokenId, setGmDragTokenId] = useState<string | null>(null);
  const [monsterKnowledgeToken, setMonsterKnowledgeToken] = useState<BattleToken | null>(null);
  const [playerBestiaryTarget, setPlayerBestiaryTarget] = useState<{
    token: BattleToken;
    ownerId: string;
  } | null>(null);
  const [areaCenter, setAreaCenter] = useState<Axial | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [channelExtraPa, setChannelExtraPa] = useState(0);
  const [actionRingAt, setActionRingAt] = useState<{ x: number; y: number } | null>(null);
  /** ID do token que abriu o ring — fecha ring só quando selectedId muda para outro token. */
  const ringTokenIdRef = useRef<string | null>(null);
  const [spellPickerOpen, setSpellPickerOpen] = useState(false);
  const [gmHpEditTokenId, setGmHpEditTokenId] = useState<string | null>(null);
  const [friendlyFireTargetId, setFriendlyFireTargetId] = useState<string | null>(null);
  const [friendlyFireBusy, setFriendlyFireBusy] = useState(false);
  const [deleteTokenConfirmOpen, setDeleteTokenConfirmOpen] = useState(false);
  const [deleteTokenBusy, setDeleteTokenBusy] = useState(false);
  const [spellTargetIds, setSpellTargetIds] = useState<string[]>([]);
  const [spellTargetBusy, setSpellTargetBusy] = useState(false);
  const attackBusyRef = useRef(false);
  const [modalStatusToken, setModalStatusToken] = useState<BattleToken | null>(null);
  const { visible: hudVisible, setHudVisible } = useCombatHudVisible(roomId);
  const toast = useVttToast();
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [mapImgTick, setMapImgTick] = useState(0);
  const [dungeonLayer, setDungeonLayer] = useState<DungeonEditLayer>("floor");
  const [dungeonModeOpen, setDungeonModeOpen] = useState(false);
  const [dungeonEditorActive, setDungeonEditorActive] = useState(false);
  const [dungeonTool, setDungeonTool] = useState<DungeonEditorTool>("wall");
  const [selectedDungeonObjectId, setSelectedDungeonObjectId] = useState<string | null>(null);
  const [mapToolMode, setMapToolMode] = useState<MapToolMode>("token");
  const [measurePreview, setMeasurePreview] = useState<MeasurePreview | null>(null);
  const [whiteboardActive, setWhiteboardActive] = useState(false);
  const [whiteboardTool, setWhiteboardTool] = useState<WhiteboardTool>("select");
  const [markupColor, setMarkupColor] = useState("#3498db");
  const [markupWidth, setMarkupWidth] = useState(4);
  const [markupDurability, setMarkupDurability] = useState<MapMarkupDurability>("temporary");
  const [markupPreview, setMarkupPreview] = useState<MapMarkup | null>(null);
  const [selectedMarkupId, setSelectedMarkupId] = useState<string | null>(null);
  const [markupTextDraft, setMarkupTextDraft] = useState<{ wx: number; wy: number } | null>(null);
  const [floorPreview, setFloorPreview] = useState<{
    mapImageScale?: number;
    mapImageOffsetX?: number;
    mapImageOffsetY?: number;
  } | null>(null);

  /** `scene` é a fonte de verdade do tabuleiro (sync imediato + SSE). */
  const displayScene = scene;
  const combat = useMemo(
    () =>
      normalizeCombatTrack(
        snapshot?.combat ?? emptyCombat(),
        displayScene.tokens
      ),
    [snapshot?.combat, displayScene.tokens]
  );
  const canvasScene = useMemo(() => {
    if (!floorPreview) return displayScene;
    return { ...displayScene, ...floorPreview };
  }, [displayScene, floorPreview]);
  const displayMarkups = useMemo(
    () => pruneMapMarkups(mapMarkupsOf(displayScene)),
    [displayScene]
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

  const visibleCellSet = useMemo(() => {
    if (canControlCombat) return null;
    return visibleCellSetForPlayer(displayScene, displayScene.tokens, {
      userId: session?.id,
      actorIds: playerActorIds,
    });
  }, [canControlCombat, displayScene, playerActorIds, session?.id]);

  const listTokens = useMemo(() => {
    if (canControlCombat) return displayScene.tokens;
    return filterTokensForFog(displayScene.tokens, displayScene, visibleCellSet, {
      userId: session?.id,
      actorIds: playerActorIds,
    });
  }, [canControlCombat, displayScene, visibleCellSet, session?.id, playerActorIds]);

  useEffect(() => {
    if (!selectedId) return;
    if (listTokens.some((t) => t.id === selectedId)) return;
    setSelectedId(listTokens[0]?.id ?? null);
  }, [listTokens, selectedId]);

  const { imagesRef, imgTick } = useTokenImages(displayScene.tokens);
  const refresh = onRefresh ?? (() => {});
  const roomSettings = useMemo(
    () => normalizeRoomSettings(snapshot?.settings),
    [snapshot?.settings]
  );

  const turnActiveId = combat
    ? resolveLivingActiveTokenId(combat, displayScene.tokens) ?? activeTokenId(combat)
    : null;
  const turn = useCombatTurn({
    combat,
    canBypassTurn: canBypassTurnProp,
    tokens: displayScene.tokens,
    combatActive: roomSettings.combatActive,
  });
  const tokenBypass = useCallback(
    (t: BattleToken) => effectiveBypassTurn(t, canBypassTurnProp),
    [canBypassTurnProp]
  );

  const tokenControl =
    canControlToken ?? ((t: BattleToken) => canControlCombat || Boolean(t.linked));

  const canOperateToken = useCallback(
    (t: BattleToken) => {
      if (isMonsterToken(t)) return canControlCombat;
      return canControlCombat || tokenControl(t);
    },
    [canControlCombat, tokenControl]
  );

  const actionRingBlockReason = useCallback(
    (t: BattleToken): string | null => {
      if (!canOperateToken(t)) {
        return "Você não controla este personagem.";
      }
      if (!roomSettings.combatActive) return null;
      const track = combat;
      if (!track?.order?.length) return null;
      const activeId = turnActiveId ?? activeTokenId(track);
      if (
        !canActOnCombatTurn(t.id, {
          combat: track,
          activeTokenId: activeId,
          bypassTurn: false,
          combatHasOrder: true,
          combatActive: roomSettings.combatActive,
        })
      ) {
        if (!activeId) return "Aguarde a iniciativa.";
        const active = displayScene.tokens.find((tok) => tok.id === activeId);
        if (active) {
          return canControlCombat
            ? `Ações só na vez de cada token — agora é ${active.name}. Passe o turno ou use a ordem de iniciativa.`
            : `Não é a vez de ${t.name} — turno de ${active.name}.`;
        }
        return TURN_WAIT_MSG;
      }
      return null;
    },
    [combat, canOperateToken, canControlCombat, displayScene.tokens, roomSettings.combatActive, turnActiveId]
  );

  const canPreviewTurnMove = useCallback(
    (t: BattleToken) => actionRingBlockReason(t) == null,
    [actionRingBlockReason]
  );

  const canOpenActionRing = useCallback(
    (t: BattleToken) => {
      if (!canOperateToken(t)) return false;
      if (canControlCombat) return true;
      return actionRingBlockReason(t) == null;
    },
    [canOperateToken, canControlCombat, actionRingBlockReason]
  );

  const onActionRingBlocked = useCallback(
    (t: BattleToken) => {
      const reason = actionRingBlockReason(t);
      if (reason) toast.push(reason, "warn");
    },
    [actionRingBlockReason, toast]
  );

  const selected = listTokens.find((t) => t.id === selectedId) ?? null;
  const selectedActor =
    selected?.linked && selected.actorId ? snapshot?.actors[selected.actorId] ?? null : null;

  const activeCombatAction = useMemo(() => {
    if (selectedCombatAction) return selectedCombatAction;
    if (selectedActor) {
      try {
        return resolveCombatAction(selectedActor);
      } catch {
        const fallback = listTokenCombatActions(selected!, selectedActor)[0];
        return fallback ?? null;
      }
    }
    if (selected) return listTokenCombatActions(selected, null)[0] ?? null;
    return null;
  }, [selectedCombatAction, selectedActor, selected]);

  const focusByTokenId = usePortraitFocusByToken(displayScene.tokens, snapshot?.actors);

  const isRoomGmComputed = useMemo(
    () => (session ? canManageRoom({ ownerId: roomOwnerId }, session) : false),
    [session, roomOwnerId]
  );
  const isRoomGm = isRoomGmProp ?? isRoomGmComputed;

  useEffect(() => {
    if (!isRoomGm) {
      setDungeonModeOpen(false);
      setDungeonEditorActive(false);
    }
  }, [isRoomGm]);

  const canViewMonsterKnowledge = !isRoomGm || simulatePlayerView;

  const openMonsterKnowledge = useCallback(
    (token: BattleToken) => {
      if (!canViewMonsterKnowledge || !isMonsterToken(token)) return;
      setMonsterKnowledgeToken(token);
    },
    [canViewMonsterKnowledge]
  );

  const closeMonsterKnowledge = useCallback(() => {
    setMonsterKnowledgeToken(null);
  }, []);

  const openMonsterSheetForToken = useCallback(
    (token: BattleToken) => {
      const target = resolveMonsterSheetOpenTarget(token);
      if (!target) return;
      if (target.kind === "compendium") {
        onOpenMonsterSheet?.(target.entryId);
        return;
      }
      onOpenSheet?.(target.actorId);
    },
    [onOpenSheet, onOpenMonsterSheet]
  );

  const canOpenPlayerBestiary = useCallback(
    (token: BattleToken) => {
      if (!isRoomGm || isMonsterToken(token) || !token.linked || !token.actorId) return false;
      const actor = roomActors[token.actorId];
      return Boolean(actor && !actor.gmAuthored && actor.ownerId);
    },
    [isRoomGm, roomActors]
  );

  const openPlayerBestiary = useCallback(
    (token: BattleToken) => {
      if (!canOpenPlayerBestiary(token) || !token.actorId) return;
      const ownerId = roomActors[token.actorId]?.ownerId;
      if (!ownerId) return;
      setPlayerBestiaryTarget({ token, ownerId });
      setActionRingAt(null);
    },
    [canOpenPlayerBestiary, roomActors]
  );

  const closePlayerBestiary = useCallback(() => {
    setPlayerBestiaryTarget(null);
  }, []);

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

  const tokenHpDisplay = useMemo(() => {
    const map = new Map<
      string,
      ReturnType<typeof resolveTokenHpDisplay>
    >();
    for (const token of displayScene.tokens) {
      map.set(
        token.id,
        resolveTokenHpDisplay(token, {
          isRoomGm,
          showMonsterHpToPlayers: roomSettings.showMonsterHpToPlayers,
          hovered: false,
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
  const gmRepositionBusyRef = useRef(false);
  const appliedSceneRevisionRef = useRef(0);
  const pendingCombatSnapRef = useRef<RoomSnapshot | null>(null);

  const resolveRoomPayload = useCallback(
    (payload: RoomApiPayload): RoomSnapshot =>
      applyRoomApiPayload(snapshot ?? pendingCombatSnapRef.current, payload),
    [snapshot]
  );

  const applyCombatSnapshot = useCallback(
    (payload: RoomApiPayload) => {
      const snap = resolveRoomPayload(payload);
      if (snap.revision >= appliedSceneRevisionRef.current) {
        appliedSceneRevisionRef.current = snap.revision;
      }
      startTransition(() => {
        setScene((prev) => mergeScenePreservingPortraits(prev, snap.scene));
      });
      onApplySnapshot?.(payload, { force: true });
    },
    [onApplySnapshot, resolveRoomPayload]
  );

  const applyPendingCombatSnap = useCallback(
    (snap: RoomSnapshot) => {
      applyCombatSnapshot(snap);
    },
    [applyCombatSnapshot]
  );

  const {
    combatFx,
    setCombatFx,
    combatFxQueueRef,
    combatFxIdRef,
    seenCombatRef,
    fxLiveGateRef,
    tokenFlash,
    tokenCastFx,
    playCombatFxFromSnapRef,
    onCombatApplyState,
    onCombatFxDone,
    onCombatTokenFlash,
    onTokenCastFx,
  } = useBattlefieldCombatFxQueue({
    roomId,
    snapshot,
    applyCombatSnapshot: applyPendingCombatSnap,
    resolveRoomPayload,
    pendingCombatSnapRef,
  });

  const shouldDeferSceneSync = useCallback(() => {
    return (
      combatFxIdRef.current != null ||
      combatFxQueueRef.current.length > 0 ||
      moveAnimRef.current != null ||
      moveBusyRef.current ||
      gmRepositionBusyRef.current
    );
  }, []);

  const syncRoom = useCallback(
    (payload?: RoomApiPayload, opts?: { force?: boolean; immediate?: boolean }) => {
      if (!payload) {
        refresh();
        return;
      }
      const snap = resolveRoomPayload(payload);
      if (snap.revision >= appliedSceneRevisionRef.current) {
        appliedSceneRevisionRef.current = snap.revision;
      }

      const deferScene = shouldDeferSceneSync();

      if (deferScene) {
        pendingCombatSnapRef.current = snap;
        if (onApplySnapshot) {
          onApplySnapshot(payload, {
            force: opts?.force ?? true,
            immediate: opts?.immediate === true,
          });
        } else {
          refresh();
        }
        playCombatFxFromSnapRef.current?.(payload);
        return;
      }

      if (snap.scene) {
        startTransition(() => {
          setScene((prev) => mergeScenePreservingPortraits(prev, snap.scene));
        });
      }
      const immediate = opts?.immediate === true;
      if (onApplySnapshot) onApplySnapshot(payload, { force: opts?.force ?? true, immediate });
      else refresh();
      playCombatFxFromSnapRef.current?.(payload);
    },
    [onApplySnapshot, refresh, resolveRoomPayload, shouldDeferSceneSync]
  );

  const battlefieldView = useBattlefieldView({ wrapRef, canvasRef });
  const canvasWrapSize = useCanvasWrapSize(wrapRef);
  const combatTurnFocusKey = useMemo(() => {
    if (!combat?.order?.length) return null;
    return `${combat.round}:${combat.activeIndex}:${turnActiveId ?? ""}`;
  }, [combat?.round, combat?.activeIndex, combat?.order?.length, turnActiveId]);
  const prevCombatTurnFocusKey = useRef<string | null>(null);

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
    enabled: battlefieldGm,
    allowActorDrop: canEdit,
    onSpawned: syncRoom,
    setHoverAxial,
    onHoverAxialChange,
    onError: setActionErr,
    viewRef: battlefieldView.viewRef,
  });

  const spawnDropPreview = useMemo(() => {
    if (!spawnDragActive || !hoverAxial) return null;
    const payload = getActiveSpawnDragPayload();
    if (!payload) return null;
    const placement = resolveMonsterSpawnPlacement(displayScene, hoverAxial, payload.entryId, {
      variant: payload.variant,
      groupLevelDelta: payload.groupLevelDelta || undefined,
    });
    if (!placement.ok) {
      return { valid: false as const, footprintKeys: null };
    }
    const size = placement.token.creatureSize ?? "medium";
    if (size === "small" || size === "medium") {
      return { valid: true as const, footprintKeys: null };
    }
    return {
      valid: true as const,
      footprintKeys: new Set(
        occupiedCells(placement.anchor, size).map((h) => `${h.q},${h.r}`)
      ),
    };
  }, [spawnDragActive, hoverAxial, displayScene]);

  const spawnDropFootprintKeys = spawnDropPreview?.footprintKeys ?? null;
  const spawnDropInvalid = spawnDropPreview?.valid === false;

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
    combatHasOrder: Boolean(combat?.order?.length),
    roomSettings,
    combat,
    gmRepositionActive: Boolean(gmDragTokenId),
  });

  const moveHoverFootprintKeys = useMemo(() => {
    const mover = isMoveMode(actionMode)
      ? selected
      : highlights.turnMovePreview
        ? hoverTurnToken
        : null;
    if (!highlights.showMovement || !mover || !highlights.hoverMovePreview?.ok) return null;
    const path = highlights.hoverMovePreview.path;
    if (!path?.length) return null;
    const dest = path[path.length - 1]!;
    const raca = mover.actorId ? actorRacas[mover.actorId] : undefined;
    const size = creatureSizeOf(mover, raca);
    if (size === "small" || size === "medium") return null;
    return new Set(occupiedCells(dest, size).map((h) => `${h.q},${h.r}`));
  }, [
    actionMode,
    selected,
    highlights.turnMovePreview,
    highlights.showMovement,
    highlights.hoverMovePreview,
    hoverTurnToken,
    actorRacas,
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

  /** Hover no canvas só quando há ação (movimento, magia, spawn, editor). */
  const trackGridHover = useMemo(
    () =>
      Boolean(
        highlights.showMovement ||
          highlights.isAreaSpellMode ||
          (spawnDragActive && (battlefieldGm || canEdit)) ||
          dungeonMapEditing ||
          mapToolMode === "measure" ||
          gmDragTokenId
      ),
    [
      highlights.showMovement,
      highlights.isAreaSpellMode,
      spawnDragActive,
      canControlCombat,
      canEdit,
      dungeonMapEditing,
      mapToolMode,
      gmDragTokenId,
    ]
  );

  const hoverAxialForCanvas = useMemo(() => {
    if (!trackGridHover) return null;
    return hoverAxial;
  }, [trackGridHover, hoverAxial]);

  const canvasState: GridCanvasDrawState = useMemo(
    () => ({
      scene: canvasScene,
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
      hoverAxial: hoverAxialForCanvas,
      hoverMovePreview: highlights.hoverMovePreview,
      spawnDropHover: spawnDragActive && (battlefieldGm || canEdit),
      spawnDropFootprintKeys,
      spawnDropInvalid,
      moveHoverFootprintKeys,
      pathCells: highlights.hoverPathCells ?? [],
      focusByTokenId,
      selectedId,
      turnActiveId,
      attackableIds: highlights.attackableIds,
      rangeTargetIds: highlights.rangeTargetIds,
      spellPickedTargetIds:
        spellTargetIds.length > 0 ? new Set(spellTargetIds) : undefined,
      hoverAttackTargetId: hoverTargetId,
      hoverTokenId,
      tokenFlash,
      tokenCastFx,
      visibleCellSet,
      pings: displayPings,
      mapImage,
      mapBackdropTone: mapBackdropToneValue,
      tokenHpDisplay,
      roomSettings,
      roomActors,
      ownerDisplayNames,
      dungeonEditorActive: dungeonMapEditing,
      floorEditActive: floorMapEditing,
      dungeonEditorTool:
        dungeonTool === "wall" || dungeonTool === "object" ? dungeonTool : null,
      selectedDungeonObjectId,
      mapMarkups: displayMarkups,
      markupPreview,
      selectedMarkupId,
      measurePreview,
    }),
    [
      canvasScene,
      mapBackdropToneValue,
      displayMarkups,
      markupPreview,
      selectedMarkupId,
      measurePreview,
      highlights.showMovement,
      highlights.turnMovePreview,
      highlights.walkSet,
      highlights.paidWalkSet,
      highlights.rangeSet,
      highlights.attackRangeSet,
      highlights.isAreaSpellMode,
      highlights.areaPreviewSet,
      highlights.areaDirectionSet,
      highlights.hoverMovePreview,
      highlights.hoverPathCells,
      highlights.attackableIds,
      highlights.rangeTargetIds,
      highlights.moveMode,
      actionMode,
      hoverAxialForCanvas,
      spawnDragActive,
      spawnDropFootprintKeys,
      spawnDropInvalid,
      moveHoverFootprintKeys,
      canControlCombat,
      focusByTokenId,
      selectedId,
      turnActiveId,
      hoverTargetId,
      hoverTokenId,
      tokenFlash,
      tokenCastFx,
      visibleCellSet,
      displayPings,
      mapImage,
      tokenHpDisplay,
      roomSettings,
      roomActors,
      ownerDisplayNames,
      dungeonMapEditing,
      floorMapEditing,
      dungeonTool,
      selectedDungeonObjectId,
      spellTargetIds,
    ]
  );

  const { redraw } = useGridCanvas(
    canvasRef,
    wrapRef,
    imagesRef,
    canvasState,
    imgTick + mapImgTick,
    moveAnimRef,
    battlefieldView.viewRef,
    battlefieldView.subscribeViewDraw
  );

  useLayoutEffect(() => {
    const anim = moveAnimRef.current;
    if (!anim) return;
    const token = scene.tokens.find((t) => t.id === anim.tokenId);
    if (
      !token ||
      (token.axial.q === anim.q && token.axial.r === anim.r)
    ) {
      moveAnimRef.current = null;
      redraw();
    }
  }, [scene, redraw]);

  useEffect(() => {
    if (floorPreview) redraw();
  }, [floorPreview, redraw]);

  const mergeTokenCombatFields = useCallback(
    (local: BattleToken, remote: BattleToken): BattleToken => ({
      ...local,
      pa: remote.pa,
      paMax: remote.paMax,
      bankedPa: remote.bankedPa,
      paSpentThisTurn: remote.paSpentThisTurn,
      vida: remote.vida,
      vidaMax: remote.vidaMax,
      defesa: remote.defesa,
      defesaBonus: remote.defesaBonus,
      weakened: remote.weakened,
      nameplateMode: remote.nameplateMode,
      conditions: remote.conditions,
      timedEffects: remote.timedEffects,
      actionRecharge: remote.actionRecharge,
      ...mergeTokenPortraitFields(local, remote),
    }),
    []
  );

  const flushPendingSceneSnapshot = useCallback(() => {
    if (
      moveAnimRef.current ||
      moveBusyRef.current ||
      gmRepositionBusyRef.current
    ) {
      return;
    }
    const snap = pendingCombatSnapRef.current;
    if (!snap) return;
    pendingCombatSnapRef.current = null;
    syncRoom(snap);
  }, [syncRoom]);

  useEffect(() => {
    appliedSceneRevisionRef.current = 0;
    moveAnimRef.current = null;
    moveBusyRef.current = false;
    gmRepositionBusyRef.current = false;
  }, [roomId]);

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const snapshotRevision = snapshot?.revision ?? 0;
  const mapSyncRef = useRef({
    scene: null as BattleScene | null,
    combat: snapshot?.combat ?? null,
    settings: snapshot?.settings ?? null,
  });

  useEffect(() => {
    const snap = snapshotRef.current;
    if (!snap) return;
    if (snap.revision <= appliedSceneRevisionRef.current) return;

    const mapUnchanged =
      snap.scene === mapSyncRef.current.scene &&
      snap.combat === mapSyncRef.current.combat &&
      snap.settings === mapSyncRef.current.settings;

    if (mapUnchanged) {
      appliedSceneRevisionRef.current = snap.revision;
      return;
    }

    mapSyncRef.current = {
      scene: snap.scene,
      combat: snap.combat,
      settings: snap.settings,
    };

    const pendingFx = snap.chat.some((m) => {
      if (!isPlayableCombatFxMessage(m) || seenCombatRef.current.has(m.id)) return false;
      const gate = fxLiveGateRef.current;
      if (!gate.seeded) return false;
      return isLiveCombatFxMessage(m, gate.joinedAt);
    });
    if (
      pendingFx ||
      combatFx !== null ||
      combatFxQueueRef.current.length > 0 ||
      moveAnimRef.current ||
      moveBusyRef.current ||
      gmRepositionBusyRef.current
    ) {
      pendingCombatSnapRef.current = snap;
      startTransition(() => {
        setScene((prev) => ({
          ...prev,
          tokens: prev.tokens.map((t) => {
            const remote = snap.scene.tokens.find((r) => r.id === t.id);
            return remote ? mergeTokenCombatFields(t, remote) : t;
          }),
        }));
      });
      return;
    }

    appliedSceneRevisionRef.current = snap.revision;
    startTransition(() => {
      setScene((prev) => mergeScenePreservingPortraits(prev, snap.scene));
    });
  }, [snapshotRevision, combatFx, mergeTokenCombatFields, roomSettings.combatActive]);

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
    setSpellTargetIds([]);
  }, [actionMode, selectedCombatAction?.entryId]);

  const selectedBypass = selected ? tokenBypass(selected) : false;

  // Fecha ring apenas quando o token selecionado muda para um token diferente do que abriu o ring.
  useEffect(() => {
    if (ringTokenIdRef.current !== null && ringTokenIdRef.current !== selectedId) {
      setActionRingAt(null);
      ringTokenIdRef.current = null;
    }
  }, [selectedId]);

  // Reseta estado de combate quando token, turno ou rodada mudam.
  useEffect(() => {
    setActionMode("idle");
    setSelectedCombatAction(null);
    setChannelExtraPa(0);
    setAreaCenter(null);
    setSpellTargetIds([]);
  }, [selectedId, turnActiveId, snapshot?.combat?.round]);

  // Fecha ring se o token selecionado perdeu permissão de agir (ex: turno passou).
  useEffect(() => {
    if (actionRingAt && selected && !canOpenActionRing(selected)) {
      setActionRingAt(null);
      ringTokenIdRef.current = null;
    }
  }, [actionRingAt, selected, canOpenActionRing]);

  useEffect(() => {
    if (!deleteTokenConfirmOpen) return;
    if (!selectedId || !selected) setDeleteTokenConfirmOpen(false);
  }, [deleteTokenConfirmOpen, selectedId, selected]);

  const removeSelectedToken = useCallback(async () => {
    if (!canControlCombat || !selectedId || !selected) return;
    setActionErr(null);
    setDeleteTokenBusy(true);
    const removedId = selectedId;
    const removedName = selected.name;
    try {
      if (moveAnimRef.current?.tokenId === removedId) moveAnimRef.current = null;
      if (gmDragTokenId === removedId) setGmDragTokenId(null);
      const snap = await deleteRoomToken(roomId, removedId);
      pendingCombatSnapRef.current = null;
      syncRoom(snap);
      const nextId = snap.scene.tokens[0]?.id ?? null;
      setSelectedId(nextId);
      setActionRingAt(null);
      setDeleteTokenConfirmOpen(false);
      redraw();
      toast.push(`${removedName} removido do mapa`, "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao remover token";
      setActionErr(msg);
      toast.push(msg, "warn");
    } finally {
      setDeleteTokenBusy(false);
    }
  }, [canControlCombat, selectedId, selected, roomId, syncRoom, toast, gmDragTokenId, redraw]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (shouldIgnoreBattlefieldShortcut(e.target)) return;

      if (e.key === "Delete") {
        e.preventDefault();
        e.stopPropagation();
        if (deleteTokenConfirmOpen || deleteTokenBusy) return;
        if (!canControlCombat || !selectedId || !selected || actionMode !== "idle" || actionRingAt) {
          return;
        }
        setDeleteTokenConfirmOpen(true);
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
        setSpellTargetIds([]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    actionRingAt,
    actionMode,
    canControlCombat,
    selected,
    selectedId,
    deleteTokenConfirmOpen,
    deleteTokenBusy,
    toast,
  ]);

  const tokenDrawPosition = useCallback(
    (token: import("@/lib/vtt/types").BattleToken) => {
      const anim = moveAnimRef.current;
      if (anim && anim.tokenId === token.id) return { q: anim.q, r: anim.r };
      return token.axial;
    },
    []
  );

  useEffect(() => {
    if (combatTurnFocusKey === null) {
      prevCombatTurnFocusKey.current = null;
      return;
    }
    if (prevCombatTurnFocusKey.current === null) {
      prevCombatTurnFocusKey.current = combatTurnFocusKey;
      if (isRoomGm && canControlCombat && turnActiveId) {
        setSelectedId(turnActiveId);
      }
      return;
    }
    if (prevCombatTurnFocusKey.current === combatTurnFocusKey) return;
    prevCombatTurnFocusKey.current = combatTurnFocusKey;

    if (!turnActiveId) return;
    const token = displayScene.tokens.find((t) => t.id === turnActiveId);
    if (!token) return;

    if (isRoomGm && canControlCombat) {
      setSelectedId(turnActiveId);
    }

    const canvas = canvasRef.current;
    if (!canvas || canvas.clientWidth < 10 || canvas.clientHeight < 10) return;

    const { ox, oy } = canvasCenter(canvas.clientWidth, canvas.clientHeight);
    const grid = resolveMapAlignedGridLayout(displayScene, ox, oy);
    const pos = tokenDrawPosition(token);
    const size = creatureSizeOf(token, actorRacas[token.actorId ?? ""]);
    const { x, y } = tokenPixelCenter(pos, size, grid.cellSize, grid.ox, grid.oy);

    requestAnimationFrame(() => {
      battlefieldView.centerOnWorld(x, y);
    });
  }, [
    combatTurnFocusKey,
    turnActiveId,
    isRoomGm,
    canControlCombat,
    displayScene.tokens,
    displayScene.cellSize,
    actorRacas,
    tokenDrawPosition,
    battlefieldView.centerOnWorld,
    canvasRef,
  ]);

  const castAreaSpell = useCallback(
    async (center: Axial, direction?: number) => {
      if (!selected || !activeCombatAction?.areaShape) return;
      setActionErr(null);
      try {
        const snap = await postRoomAreaSpell(roomId, selected.id, center.q, center.r, {
          actionEntryId: activeCombatAction.entryId,
          bypassTurn: selectedBypass,
          areaDirection: direction,
          channelExtraPa,
        });
        syncRoom(snap, { force: true });
        setActionMode("idle");
        setAreaCenter(null);
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Falha na magia de área");
      }
    },
    [selected, selectedBypass, activeCombatAction, roomId, channelExtraPa, syncRoom]
  );

  const actionPreview: ActionPreview | null = useMemo(() => {
    if (!selected) return null;
    if (highlights.showMovement && hoverAxial && highlights.hoverMovePreview) {
      const movePaOpts = movementPaOptsForRoom(
        roomSettings,
        combat,
        selectedActor,
        selectedBypass
      );
      return previewMoveFromCheck(
        highlights.hoverMovePreview,
        selected,
        highlights.moveMode,
        movePaOpts
      );
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
    selectedBypass,
    hoverAxial,
    hoverTargetId,
    highlights.showMovement,
    highlights.hoverMovePreview,
    highlights.moveMode,
    highlights.needsAreaDirection,
    highlights.isAreaSpellMode,
    activeCombatAction,
    actionMode,
    areaCenter,
    displayScene.tokens,
    turn,
    channelExtraPa,
    snapshot?.actors,
  ]);

  const actionPreviewAnchor = useMemo(() => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const { ox, oy } = canvasCenter(w, h);
    const grid = resolveMapAlignedGridLayout(displayScene, ox, oy);
    const tokenR = cellDrawRadius(grid.cellSize) * (battlefieldView.view.scale ?? 1);
    const gap = 10;

    const axialToScreen = (q: number, r: number) => {
      const local = axialToPixel(q, r, grid.cellSize, grid.ox, grid.oy);
      return worldToScreen(local.x, local.y, w, h, battlefieldView.view);
    };

    if (highlights.showMovement && hoverAxial && isMoveMode(actionMode)) {
      const screen = axialToScreen(hoverAxial.q, hoverAxial.r);
      return { x: screen.x, y: screen.y - tokenR - gap };
    }

    if (
      highlights.isAreaSpellMode &&
      activeCombatAction &&
      hoverAxial &&
      !highlights.needsAreaDirection
    ) {
      const screen = axialToScreen(hoverAxial.q, hoverAxial.r);
      return { x: screen.x, y: screen.y - tokenR - gap };
    }

    if (
      !hoverTargetId ||
      !activeCombatAction ||
      !isTargetMode(actionMode) ||
      highlights.isAreaSpellMode
    ) {
      return null;
    }
    const defender = displayScene.tokens.find((t) => t.id === hoverTargetId);
    if (!defender) return null;
    const screen = axialToScreen(defender.axial.q, defender.axial.r);
    return { x: screen.x, y: screen.y - tokenR - gap };
  }, [
    highlights.showMovement,
    highlights.isAreaSpellMode,
    highlights.needsAreaDirection,
    hoverAxial,
    actionMode,
    hoverTargetId,
    activeCombatAction,
    displayScene,
    battlefieldView.view,
  ]);

  const combatFxGrid = useMemo(() => {
    const wrap = wrapRef.current;
    const w = wrap?.clientWidth ?? 800;
    const h = wrap?.clientHeight ?? 640;
    const { ox, oy } = canvasCenter(w, h);
    return resolveMapAlignedGridLayout(displayScene, ox, oy);
  }, [
    displayScene.cellSize,
    displayScene.mapImageUrl,
    displayScene.mapImageScale,
    displayScene.mapImageOffsetX,
    displayScene.mapImageOffsetY,
    canvasWrapSize,
  ]);

  const fireSelfAbility = useCallback(
    async (action: CombatActionOption, token = selected) => {
      if (!token || !action.selfTarget) return;
      setActionErr(null);
      try {
        const bypass = tokenBypass(token);
        const snap =
          action.kind === "ability"
            ? await postRoomAbility(roomId, token.id, null, {
                actionEntryId: action.entryId,
                bypassTurn: bypass,
              })
            : await postRoomAttack(
                roomId,
                token.id,
                token.id,
                combatAttackRequestOpts(action, token, { bypassTurn: bypass })
              );
        syncRoom(snap, { force: true });
        setActionMode("idle");
        setSelectedCombatAction(null);
        setActionRingAt(null);
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Falha na ação");
      }
    },
    [selected, roomId, tokenBypass, syncRoom]
  );

  const executeMultiTargetCast = useCallback(
    async (targetIds: string[]) => {
      if (!selected || !activeCombatAction || targetIds.length === 0) return;
      setSpellTargetBusy(true);
      setActionErr(null);
      try {
        const snap = await postRoomAttack(
          roomId,
          selected.id,
          targetIds[0]!,
          {
            ...combatAttackRequestOpts(activeCombatAction, selected, {
              bypassTurn: selectedBypass,
              channelExtraPa,
            }),
            defenderTokenIds: targetIds,
          }
        );
        syncRoom(snap, { force: true });
        setSpellTargetIds([]);
        setActionMode("idle");
        setSelectedCombatAction(null);
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Falha na magia");
      } finally {
        setSpellTargetBusy(false);
      }
    },
    [
      selected,
      selectedBypass,
      activeCombatAction,
      roomId,
      channelExtraPa,
      syncRoom,
    ]
  );

  const tryAddSpellTarget = useCallback(
    async (defenderId: string) => {
      if (!selected || !activeCombatAction || !isMultiTargetSpell(activeCombatAction)) return;
      const max = spellTargetCount(activeCombatAction);

      if (spellTargetIds.includes(defenderId)) {
        setSpellTargetIds((prev) => prev.filter((id) => id !== defenderId));
        return;
      }
      if (spellTargetIds.length >= max) {
        setActionErr(`Esta magia permite no máximo ${max} alvo(s).`);
        return;
      }

      const next = [...spellTargetIds, defenderId];
      setSpellTargetIds(next);
      setActionErr(null);

      if (next.length >= max) {
        await executeMultiTargetCast(next);
      }
    },
    [selected, activeCombatAction, spellTargetIds, executeMultiTargetCast]
  );

  const executeAttackOn = useCallback(
    async (defenderId: string) => {
      if (!selected || !activeCombatAction) return;
      if (attackBusyRef.current) return;
      if (
        !canActOnCombatTurn(selected.id, {
          activeTokenId: turn.activeTokenId,
          bypassTurn: selectedBypass,
          combatHasOrder: turn.combatHasOrder,
          combatActive: turn.combatActive,
        })
      ) {
        setActionErr(TURN_WAIT_MSG);
        return;
      }
      if (activeCombatAction.areaShape && activeCombatAction.areaShape !== "single") {
        setActionErr("Magia de área: clique o centro da área no mapa (não um alvo único).");
        return;
      }
      const defender = displayScene.tokens.find((t) => t.id === defenderId);
      if (!defender) {
        setActionErr("Alvo não encontrado");
        return;
      }
      const attackCheck = canAttackTarget(selected, defender, activeCombatAction, turn, {
        actor: selectedActor,
        channelExtraPa,
      });
      if (!attackCheck.ok) {
        setActionErr(attackCheck.reason ?? "Ataque indisponível");
        return;
      }
      setActionErr(null);
      attackBusyRef.current = true;
      const pending = createPendingAttackFx(selected, defender);
      combatFxIdRef.current = pending.id;
      setCombatFx(pending);
      const clearPendingAttackFx = () => {
        combatFxIdRef.current = null;
        setCombatFx(null);
      };
      try {
        let response: RoomApiPayload;
        const runPost = async (): Promise<RoomApiPayload> => {
          if (activeCombatAction.kind === "ability") {
            return postRoomAbility(roomId, selected.id, defenderId, {
              actionEntryId: activeCombatAction.entryId,
              bypassTurn: selectedBypass,
            });
          }
          return postRoomAttack(
            roomId,
            selected.id,
            defenderId,
            combatAttackRequestOpts(activeCombatAction, selected, {
              bypassTurn: selectedBypass,
              channelExtraPa,
            })
          );
        };
        let lastErr: unknown;
        for (let attempt = 0; attempt <= 2; attempt++) {
          try {
            response = await runPost();
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e;
            if (isRoomClientError(e)) break;
            if (attempt < 2) await new Promise((r) => setTimeout(r, 120 * (attempt + 1)));
          }
        }
        if (lastErr) {
          clearPendingAttackFx();
          if (isRoomClientError(lastErr)) {
            setActionErr(lastErr.message);
            return;
          }
          setActionErr("Servidor lento — sincronizando em segundo plano…");
          void (async () => {
            for (let bg = 0; bg < 4; bg++) {
              await new Promise((r) => setTimeout(r, 1500 * (bg + 1)));
              try {
                const retry = await runPost();
                syncRoom(retry, { force: true });
                setActionErr(null);
                return;
              } catch (e) {
                if (isRoomClientError(e)) {
                  setActionErr(e.message);
                  return;
                }
              }
            }
            setActionErr("Falha no ataque — recarregue a mesa ou tente de novo");
          })();
          return;
        }
        syncRoom(response!, { force: true });
        setSpellTargetIds([]);
        // Mantém modo ataque para permitir outro alvo no mesmo turno (Esc cancela).
      } catch (e) {
        clearPendingAttackFx();
        setActionErr(e instanceof Error ? e.message : "Falha no ataque");
      } finally {
        attackBusyRef.current = false;
      }
    },
    [
      selected,
      selectedBypass,
      activeCombatAction,
      roomId,
      channelExtraPa,
      selectedActor,
      setCombatFx,
      displayScene.tokens,
      syncRoom,
      turn,
    ]
  );

  const attackToken = useCallback(
    (defenderId: string) => {
      if (!selected || !activeCombatAction) return;
      const defender = displayScene.tokens.find((t) => t.id === defenderId);
      if (!defender) return;

      if (isMultiTargetSpell(activeCombatAction) && isTargetMode(actionMode)) {
        if (needsFriendlyFireConfirm(selected, defender, activeCombatAction)) {
          setFriendlyFireTargetId(defenderId);
          return;
        }
        void tryAddSpellTarget(defenderId);
        return;
      }

      if (needsFriendlyFireConfirm(selected, defender, activeCombatAction)) {
        setFriendlyFireTargetId(defenderId);
        return;
      }
      void executeAttackOn(defenderId);
    },
    [
      selected,
      activeCombatAction,
      actionMode,
      displayScene.tokens,
      executeAttackOn,
      tryAddSpellTarget,
    ]
  );

  const friendlyFireDefender = useMemo(
    () =>
      friendlyFireTargetId
        ? displayScene.tokens.find((t) => t.id === friendlyFireTargetId) ?? null
        : null,
    [friendlyFireTargetId, displayScene.tokens]
  );

  const confirmFriendlyFire = useCallback(async () => {
    if (!friendlyFireTargetId) return;
    setFriendlyFireBusy(true);
    try {
      if (isMultiTargetSpell(activeCombatAction) && isTargetMode(actionMode)) {
        await tryAddSpellTarget(friendlyFireTargetId);
      } else {
        await executeAttackOn(friendlyFireTargetId);
      }
      setFriendlyFireTargetId(null);
    } finally {
      setFriendlyFireBusy(false);
    }
  }, [
    friendlyFireTargetId,
    activeCombatAction,
    actionMode,
    executeAttackOn,
    tryAddSpellTarget,
  ]);

  const moveSelectedTo = useCallback(
    async (axial: Axial) => {
      if (!selected || !isMoveMode(actionMode) || moveBusyRef.current) return;
      if (
        !canActOnCombatTurn(selected.id, {
          activeTokenId: turn.activeTokenId,
          bypassTurn: selectedBypass,
          combatHasOrder: turn.combatHasOrder,
          combatActive: turn.combatActive,
        })
      ) {
        setActionErr(TURN_WAIT_MSG);
        return;
      }
      const moveCtx: MovementPathContext = {
        tokens: displayScene.tokens,
        gridRadius: displayScene.gridRadius,
        actorRacas,
        dungeonObjects: displayScene.dungeonObjects,
      };
      const movePaOpts = movementPaOptsForRoom(
        roomSettings,
        combat,
        selectedActor,
        selectedBypass
      );
      const check = canMoveToken(selected, axial, highlights.moveMode, moveCtx, movePaOpts);
      if (!check.ok) {
        setActionErr(check.reason ?? "Movimento inválido");
        return;
      }
      setActionErr(null);
      moveBusyRef.current = true;
      const tokenId = selected.id;
      const origin = selected.axial;
      const path = check.path ?? [origin, axial];
      const dest = path[path.length - 1] ?? axial;
      const sceneBeforeMove = displayScene;
      const optimisticScene: BattleScene = {
        ...displayScene,
        tokens: displayScene.tokens.map((t) =>
          t.id === tokenId ? { ...t, axial: dest } : t
        ),
      };
      setScene((prev) => mergeScenePreservingPortraits(prev, optimisticScene));
      moveAnimRef.current = { tokenId, q: origin.q, r: origin.r };
      redraw();
      let lastMoveRedrawMs = performance.now();
      const animPromise = animateTokenAlongPath(path, (step) => {
        moveAnimRef.current = { tokenId, q: step.q, r: step.r };
        const now = performance.now();
        if (now - lastMoveRedrawMs >= 33) {
          lastMoveRedrawMs = now;
          redraw();
        }
      });
      try {
        const payload = await moveRoomTokenBudget(
          roomId,
          tokenId,
          dest.q,
          dest.r,
          highlights.moveMode,
          selectedBypass
        );
        const snap = resolveRoomPayload(payload);
        if (!snap?.scene) throw new Error("Resposta inválida ao mover token");

        if (snap.revision >= appliedSceneRevisionRef.current) {
          appliedSceneRevisionRef.current = snap.revision;
          setScene((prev) => mergeScenePreservingPortraits(prev, snap.scene));
        }
        if (onApplySnapshot) onApplySnapshot(payload, { force: true, immediate: true });
        else void refresh();
        playCombatFxFromSnapRef.current?.(payload);

        await animPromise;
        moveAnimRef.current = null;
        redraw();
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Movimento inválido");
        setScene((prev) => mergeScenePreservingPortraits(prev, sceneBeforeMove));
        moveAnimRef.current = null;
        redraw();
        void refresh();
      } finally {
        moveBusyRef.current = false;
        flushPendingSceneSnapshot();
      }
    },
    [
      selected,
      selectedActor,
      actionMode,
      roomId,
      highlights.moveMode,
      turn.activeTokenId,
      turn.combatHasOrder,
      selectedBypass,
      onApplySnapshot,
      redraw,
      refresh,
      flushPendingSceneSnapshot,
      displayScene,
      displayScene.tokens,
      displayScene.gridRadius,
      displayScene.dungeonObjects,
      actorRacas,
      roomSettings,
      combat,
    ]
  );

  const canRepositionToken = useCallback(
    (_token: BattleToken) => canManageBattlefield ?? canRepositionTokens,
    [canManageBattlefield, canRepositionTokens]
  );

  const onRepositionToken = useCallback(
    async (tokenId: string, axial: Axial) => {
      setActionErr(null);
      moveAnimRef.current = null;
      gmRepositionBusyRef.current = true;
      setScene((prev) => ({
        ...prev,
        tokens: prev.tokens.map((t) =>
          t.id === tokenId ? { ...t, axial } : t
        ),
      }));
      redraw();

      try {
        const snap = await repositionRoomToken(roomId, tokenId, axial.q, axial.r);
        if (!snap?.scene) throw new Error("Resposta inválida ao mover token");
        pendingCombatSnapRef.current = null;
        appliedSceneRevisionRef.current = snap.revision;
        setScene((prev) => mergeScenePreservingPortraits(prev, snap.scene));
        syncRoom(snap);
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Falha ao mover token");
        refresh();
      } finally {
        gmRepositionBusyRef.current = false;
        setGmDragTokenId(null);
        flushPendingSceneSnapshot();
        redraw();
      }
    },
    [roomId, syncRoom, redraw, flushPendingSceneSnapshot, refresh]
  );

  const onGmDragPreview = useCallback(
    (tokenId: string, axial: Axial | null) => {
      if (axial) {
        setGmDragTokenId(tokenId);
        moveAnimRef.current = { tokenId, q: axial.q, r: axial.r };
      } else if (!gmRepositionBusyRef.current) {
        setGmDragTokenId(null);
        moveAnimRef.current = null;
        flushPendingSceneSnapshot();
      }
      redraw();
    },
    [redraw, flushPendingSceneSnapshot]
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

  const onDungeonCellEdit = useCallback(
    async (axial: Axial, dragObjectId?: string) => {
      if (!dungeonMapEditing) return;
      setActionErr(null);
      try {
        const result = await applyDungeonCellEdit(
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

  const onRevealCell = useCallback(
    async (axial: Axial) => {
      if (!canControlCombat || !displayScene.fogEnabled) return;
      setActionErr(null);
      try {
        const snap = await revealRoomCell(roomId, axial.q, axial.r);
        syncRoom(snap);
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "Falha ao revelar célula");
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

  const onMarkupTextRequest = useCallback((wx: number, wy: number) => {
    setMarkupTextDraft({ wx, wy });
  }, []);

  const pointer = useBattlefieldPointer({
    canvasRef,
    scene: displayScene,
    actorRacas,
    tokenDrawPosition,
    selectedId,
    setSelectedId,
    actionMode,
    activeCombatAction,
    attackableIds: highlights.attackableIds,
    rangeTargetIds: highlights.rangeTargetIds,
    hoverAxial,
    setHoverAxial,
    onHoverAxialChange,
    trackGridHover,
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
    onHoverPointerChange: setHoverPointer,
    onAttack: (id) => void attackToken(id),
    onMove: (a) => void moveSelectedTo(a),
    onAreaSpell: (c, d) => void castAreaSpell(c, d),
    onAreaSpellError: setActionErr,
    onPing: (a) => void onMapPing(a),
    onRevealCell: canControlCombat ? (a) => void onRevealCell(a) : undefined,
    fogEnabled: Boolean(displayScene.fogEnabled),
    viewRef: battlefieldView.viewRef,
    onActionRingRequest: (token, clientX, clientY) => {
      if (!canOpenActionRing(token)) {
        onActionRingBlocked(token);
        return;
      }
      ringTokenIdRef.current = token.id;
      setActionRingAt({ x: clientX, y: clientY });
      setActionErr(null);
    },
    canOpenActionRing,
    onActionRingBlocked,
    onOpenMonsterKnowledge: openMonsterKnowledge,
    onOpenPlayerBestiary: openPlayerBestiary,
    canOpenPlayerBestiary,
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
          onCellEdit: (a, dragId) => void onDungeonCellEdit(a, dragId),
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
    mapTools: {
      mode: mapToolMode,
      onMeasurePreview: setMeasurePreview,
    },
  });

  const handleDrawToolChange = useCallback((tool: WhiteboardTool) => {
    setWhiteboardTool(tool);
    if (tool !== "text") setMarkupTextDraft(null);
  }, []);

  const handleMapToolModeChange = useCallback(
    (mode: MapToolMode) => {
      setMapToolMode(mode);
      setMarkupTextDraft(null);
      if (mode === "draw") {
        setWhiteboardActive(true);
        setDungeonEditorActive(false);
        setMarkupPreview(null);
      } else {
        setWhiteboardActive(false);
        setSelectedMarkupId(null);
        setMarkupPreview(null);
        pointer.cancelWhiteboardDraft();
      }
      if (mode !== "measure") setMeasurePreview(null);
    },
    [pointer.cancelWhiteboardDraft]
  );

  useEffect(() => {
    if (!whiteboardActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (shouldIgnoreBattlefieldShortcut(e.target)) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!selectedMarkupId) return;
        e.preventDefault();
        onMarkupErase(selectedMarkupId);
      }
      if (e.key === "Escape") {
        pointer.cancelWhiteboardDraft();
        setSelectedMarkupId(null);
        setMarkupTextDraft(null);
        setMeasurePreview(null);
        if (mapToolMode !== "token") setMapToolMode("token");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    whiteboardActive,
    selectedMarkupId,
    mapToolMode,
    onMarkupErase,
    pointer.cancelWhiteboardDraft,
  ]);

  const clearSessionMarkups = useCallback(() => {
    const next = mapMarkupsOf(displayScene).filter((m) => m.durability !== "temporary");
    void persistMapMarkups(next);
  }, [displayScene, persistMapMarkups]);

  const clearPermanentMarkups = useCallback(() => {
    if (!canManageMarkups) return;
    const markups = mapMarkupsOf(displayScene);
    const perm = markups.filter((m) => m.durability === "permanent").length;
    if (!perm) return;
    if (!window.confirm(`Remover ${perm} marcação(ões) permanente(s)?`)) return;
    void persistMapMarkups(markups.filter((m) => m.durability !== "permanent"));
  }, [canManageMarkups, displayScene, persistMapMarkups]);

  const clearAllMarkups = useCallback(() => {
    if (!canManageMarkups) return;
    if (!displayMarkups.length) return;
    if (!window.confirm("Limpar toda a lousa (temporária + permanente)?")) return;
    void persistMapMarkups([]);
  }, [canManageMarkups, displayMarkups.length, persistMapMarkups]);

  const canViewTokenPaFn =
    canViewTokenPa ?? (() => canControlCombat || Boolean(selected?.linked));

  const canUseToken =
    selected &&
    ((isMonsterToken(selected) && canControlCombat) ||
      (!isMonsterToken(selected) && (canControlCombat || tokenControl(selected))));

  const turnActiveToken = turnActiveId
    ? displayScene.tokens.find((t) => t.id === turnActiveId) ?? null
    : null;

  const canEndTurn = canEndTurnProp;

  const playerToken = useMemo(() => {
    if (!session) return null;
    return (
      displayScene.tokens.find(
        (t) => t.linked && t.actorId && roomActors[t.actorId]?.ownerId === session.id
      ) ?? null
    );
  }, [displayScene.tokens, roomActors, session]);

  const hudToken = isRoomGm
    ? (turnActiveToken ?? selected ?? playerToken)
    : playerToken;
  const hudIsControlled =
    Boolean(playerToken && hudToken && playerToken.id === hudToken.id) ||
    Boolean(
      isRoomGm &&
        canControlCombat &&
        hudToken &&
        turnActiveId === hudToken.id &&
        canOperateToken(hudToken)
    );
  const hudPortraitFallback = hudToken?.actorId
    ? firstPortraitDataUrl(
        roomActors[hudToken.actorId]?.tokenImageUrl,
        roomActors[hudToken.actorId]?.portraitUrl
      )
    : null;

  const resolveStatusToken = useCallback(
    (explicit?: BattleToken | null) => {
      if (explicit) return explicit;
      if (isRoomGm) return turnActiveToken ?? selected ?? playerToken;
      return playerToken;
    },
    [isRoomGm, selected, turnActiveToken, playerToken]
  );

  const handleStatusClose = useCallback(() => {
    setModalStatusToken(null);
    onStatusWindowClose?.();
  }, [onStatusWindowClose]);

  const openStatus = useCallback(
    (explicit?: BattleToken | null) => {
      const token = resolveStatusToken(explicit);
      if (!token) return;
      if (
        !explicit &&
        statusWindowLayout?.open &&
        modalStatusToken?.id === token.id
      ) {
        handleStatusClose();
        return;
      }
      setModalStatusToken(token);
      if (foundryLayout) {
        onStatusDockOpen?.();
      }
    },
    [
      resolveStatusToken,
      statusWindowLayout?.open,
      modalStatusToken?.id,
      handleStatusClose,
      foundryLayout,
      onStatusDockOpen,
    ]
  );

  useEffect(() => {
    if (!foundryLayout || !statusWindowLayout?.open) return;
    const token = resolveStatusToken();
    if (token) setModalStatusToken(token);
  }, [foundryLayout, statusWindowLayout?.open, resolveStatusToken]);

  const hoverMiniHudAnchor = useMemo(() => {
    if (!hoverTokenId || !hoverPointer) return null;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return null;

    if (foundryLayout) {
      const hudEl = document.getElementById("foundry-mesa-hud");
      if (!hudEl) return hoverPointer;
      const hudRect = hudEl.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      return {
        x: canvasRect.left - hudRect.left + hoverPointer.x,
        y: canvasRect.top - hudRect.top + hoverPointer.y,
      };
    }

    return hoverPointer;
  }, [hoverTokenId, hoverPointer, foundryLayout]);

  const hoverMiniHudToken =
    hoverTokenId != null
      ? displayScene.tokens.find((t) => t.id === hoverTokenId) ?? null
      : null;

  const targetingHoverTarget =
    hoverTargetId &&
    isTargetMode(actionMode) &&
    activeCombatAction &&
    !activeCombatAction.selfTarget &&
    !highlights.isAreaSpellMode
      ? displayScene.tokens.find((t) => t.id === hoverTargetId) ?? null
      : null;

  const showHoverMiniHud =
    Boolean(hoverMiniHudToken && hoverMiniHudAnchor) &&
    !(targetingHoverTarget && hoverMiniHudToken?.id === targetingHoverTarget.id);

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

  const gmToolsPanel =
    canControlCombat && snapshot ? (
      <GmToolsPanel
        roomId={roomId}
        scene={displayScene}
        tokens={displayScene.tokens ?? []}
        snapshot={snapshot}
        inviteCode={inviteCode}
        roomActors={roomActors}
        spawnAxial={hoverAxial}
        combatUndo={snapshot.combatUndo}
        combatLog={snapshot.combatLog}
        onSceneUpdated={(snap) => syncRoom(snap)}
        onRefresh={refresh}
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
      {gmToolsPanel}
      {dungeonPanel}
      {canControlCombat && showSpawnInSidebar ? (
        <MonsterSpawnPanel
          roomId={roomId}
          scene={displayScene}
          spawnAxial={hoverAxial}
          onSpawned={(snap) => syncRoom(snap)}
          onOpenMonsterSheet={onOpenMonsterSheet}
        />
      ) : null}
    </>
  );

  const [dockRoot, setDockRoot] = useState<HTMLElement | null>(null);
  const [hudRoot, setHudRoot] = useState<HTMLElement | null>(null);
  const [hudOverlayRoot, setHudOverlayRoot] = useState<HTMLElement | null>(null);
  const resolveDockRoot = useCallback(() => document.getElementById("foundry-sidebar-dock"), []);
  const resolveHudRoot = useCallback(() => document.getElementById("foundry-mesa-windows"), []);
  const resolveHudOverlayRoot = useCallback(
    () => (foundryLayout ? document.getElementById("foundry-mesa-hud") : null),
    [foundryLayout]
  );

  useLayoutEffect(() => {
    setDockRoot(resolveDockRoot());
    setHudRoot(resolveHudRoot());
    setHudOverlayRoot(resolveHudOverlayRoot());
  }, [resolveDockRoot, resolveHudRoot, resolveHudOverlayRoot]);

  useEffect(() => {
    if (dockRoot && hudRoot && (!foundryLayout || hudOverlayRoot)) return;
    const id = window.requestAnimationFrame(() => {
      setDockRoot(resolveDockRoot());
      setHudRoot(resolveHudRoot());
      setHudOverlayRoot(resolveHudOverlayRoot());
    });
    return () => window.cancelAnimationFrame(id);
  }, [dockRoot, hudRoot, hudOverlayRoot, foundryLayout, resolveDockRoot, resolveHudRoot, resolveHudOverlayRoot]);

  const dockTarget = dockRoot;
  const float = (id: MesaWindowId) => Boolean(isWindowFloating?.(id));

  const portalPanel = (node: ReactNode, floating: boolean) => {
    if (!node) return null;
    const target = floating ? hudRoot : dockTarget;
    return target ? createPortal(node, target) : node;
  };

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

  const initiativeUi =
    foundryLayout && initiativeWindowLayout ? (
      (() => {
        const initiativeBody = (
          <div className="mesa-panel-scroll mesa-panel-scroll--rail">
            <TurnOrderPanel
              compact
              roomId={roomId}
              snapshot={snapshot}
              combat={combat}
              tokens={listTokens}
              canControl={canControlCombat}
              canEndTurn={canEndTurnProp}
              combatUndo={snapshot?.combatUndo}
              onApplySnapshot={syncRoom}
              onUpdate={refresh}
              attackableIds={highlights.attackableIds}
              rangeTargetIds={highlights.rangeTargetIds}
              hoverAttackTargetId={hoverTargetId}
              onHoverAttackTargetChange={setHoverTargetId}
            />
            <MapTokenList
              tokens={listTokens}
              selectedId={selectedId}
              onSelect={setSelectedId}
              canViewTokenPa={canViewTokenPaFn}
              fogHint={Boolean(displayScene.fogEnabled && !canControlCombat)}
            />
          </div>
        );
        return float("initiative") ? (
          <FoundryWindow
            title="Ordem de turno"
            layout={initiativeWindowLayout}
            className="foundry-window--initiative"
            minHeight={140}
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

  const statusTokenOwnerId =
    modalStatusToken?.linked && modalStatusToken.actorId
      ? roomActors[modalStatusToken.actorId]?.ownerId
      : undefined;

  const statusCanDelegate = Boolean(
    modalStatusToken &&
      modalStatusToken.linked &&
      !isMonsterToken(modalStatusToken) &&
      statusTokenOwnerId &&
      (isRoomGm || session?.id === statusTokenOwnerId)
  );

  const statusDelegateCandidates = (memberIds ?? [])
    .filter((id) => id !== statusTokenOwnerId)
    .map((id) => ({
      userId: id,
      label: ownerDisplayNames?.get(id) ?? "Jogador",
    }));

  const statusTitle = modalStatusToken ? `Status · ${modalStatusToken.name}` : "Status";

  const statusBody = modalStatusToken ? (
    <div className="mesa-panel-scroll mesa-panel-scroll--rail">
      <TokenStatusBody
        token={modalStatusToken}
        roomId={roomId}
        combat={combat}
        canApplyConditions={isRoomGm}
        onUpdate={refresh}
        compact
        canDelegate={statusCanDelegate}
        delegateCandidates={statusDelegateCandidates}
      />
    </div>
  ) : (
    <div className="mesa-panel-scroll mesa-panel-scroll--rail">
      <MapTokenList
        tokens={listTokens}
        selectedId={selectedId}
        onSelect={setSelectedId}
        canViewTokenPa={canViewTokenPaFn}
        fogHint={Boolean(displayScene.fogEnabled && !canControlCombat)}
      />
    </div>
  );

  const statusUi =
    foundryLayout && statusWindowLayout ? (
      float("status") ? (
        <FoundryWindow
          title={statusTitle}
          layout={statusWindowLayout}
          className="foundry-window--status"
          minWidth={280}
          minHeight={220}
          onLayoutChange={onStatusWindowLayoutChange ?? (() => {})}
          onClose={handleStatusClose}
          onMinimize={onStatusWindowMinimize ?? (() => {})}
          onFocus={onStatusWindowFocus ?? (() => {})}
        >
          {statusBody}
        </FoundryWindow>
      ) : (
        <FoundryDockPanel
          title={statusTitle}
          open={statusWindowLayout.open}
          minimized={statusWindowLayout.minimized}
          className="foundry-dock-panel--status"
          onClose={handleStatusClose}
          onMinimize={onStatusWindowMinimize}
        >
          {statusBody}
        </FoundryDockPanel>
      )
    ) : null;

  const statusPortal = portalPanel(statusUi, float("status"));

  return (
    <div
      className={`vtt-shell${foundryLayout ? " vtt-shell--foundry" : ""}`}
      style={shellStyle}
    >
      {foundryLayout ? gmPortal : null}
      {foundryLayout ? dungeonPortal : null}
      {foundryLayout ? initiativePortal : null}
      {foundryLayout ? statusPortal : null}
      {!foundryLayout && leftPanel && onLeftPanelChange ? (
        <MesaDockPanel
          side="left"
          label="Ferramentas"
          layout={leftPanel}
          onLayoutChange={onLeftPanelChange}
        >
          {legacySidebar}
        </MesaDockPanel>
      ) : !foundryLayout ? (
        legacySidebar
      ) : null}

      <BattlefieldMapCanvas
        wrapRef={wrapRef}
        canvasRef={canvasRef}
        foundryLayout={foundryLayout}
        attackTargetCursor={Boolean(attackTargetCursor)}
        spawnDragActive={Boolean(spawnDragActive)}
        battlefieldView={battlefieldView}
        canvasWrapSize={canvasWrapSize}
        mapToolMode={mapToolMode}
        onMapToolModeChange={handleMapToolModeChange}
        whiteboardTool={whiteboardTool}
        onDrawToolChange={handleDrawToolChange}
        markupColor={markupColor}
        markupWidth={markupWidth}
        markupDurability={markupDurability}
        onColorChange={setMarkupColor}
        onWidthChange={setMarkupWidth}
        onDurabilityChange={(d) => {
          if (d === "permanent" && !canManageMarkups) return;
          setMarkupDurability(d);
        }}
        canUseWhiteboard={canUseWhiteboard}
        canManageMarkups={canManageMarkups}
        canPing={isRoomGm || roomSettings.allowPlayerPing}
        showFogTool={isRoomGm && Boolean(displayScene.fogEnabled)}
        onClearSession={canUseWhiteboard ? clearSessionMarkups : undefined}
        onClearPermanent={canManageMarkups ? clearPermanentMarkups : undefined}
        onClearAll={canManageMarkups ? clearAllMarkups : undefined}
        showDungeonEditor={isRoomGm}
        dungeonEditorActive={dungeonModeOpen || dungeonMapEditing}
        onToggleDungeonEditor={() => {
          handleMapToolModeChange("token");
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
        spawnDropHandlers={spawnDropHandlers}
        pointerHandlers={{
          onPointerDown: pointer.onPointerDown,
          onPointerMove: pointer.onPointerMove,
          onPointerUp: pointer.onPointerUp,
          onPointerLeave: pointer.onPointerLeave,
          onContextMenu: pointer.onContextMenu,
        }}
        markupTextDraft={markupTextDraft}
        onMarkupTextCommit={(text) => {
          onMarkupCommit(
            createWhiteboardMarkup(
              "text",
              [{ x: markupTextDraft!.wx, y: markupTextDraft!.wy }],
              text
            )
          );
          setMarkupTextDraft(null);
        }}
        onMarkupDraftCancel={() => setMarkupTextDraft(null)}
        mapGuide={
          foundryLayout
            ? {
                roomId,
                session,
                isRoomGm,
                watchOnly,
              }
            : undefined
        }
      >
        {actionRingAt && selected && canOpenActionRing(selected) ? (
          <TokenActionRing
            x={actionRingAt.x}
            y={actionRingAt.y}
            token={selected}
            allTokens={snapshot?.scene.tokens ?? []}
            actor={selectedActor}
            combat={combat}
            canBypassTurn={canBypassTurnProp}
            combatActive={roomSettings.combatActive}
            roomId={roomId}
            showTokenSheet={canShowSheetInActionRing(selected, {
              isRoomGm,
              userId: session?.id,
              roomActors,
            })}
            onOpenTokenSheet={() => openMonsterSheetForToken(selected)}
            showPlayerBestiary={canOpenPlayerBestiary(selected)}
            onOpenPlayerBestiary={() => openPlayerBestiary(selected)}
            showGmHpEdit={canControlCombat && selected.vidaMax != null}
            onOpenGmHpEdit={() => setGmHpEditTokenId(selected.id)}
            onPickMode={(mode, action) => {
              if (action?.selfTarget) {
                void fireSelfAbility(action);
                return;
              }
              setActionMode(mode);
              setSelectedCombatAction(action);
              if (mode !== "spell") setChannelExtraPa(0);
            }}
            onOpenSpellPicker={() => setSpellPickerOpen(true)}
            onClose={() => setActionRingAt(null)}
            onRoomSync={(snap) => (snap ? syncRoom(snap) : refresh())}
          />
        ) : null}
        {spellPickerOpen && selected ? (
          <SpellPickerPanel
            spells={listTokenCombatActions(selected, selectedActor, "spell")}
            actor={selectedActor}
            token={selected}
            onPick={(spell) => {
              setSelectedCombatAction(spell);
              setActionMode("spell");
              setSpellPickerOpen(false);
              setActionRingAt(null);
            }}
            onClose={() => setSpellPickerOpen(false)}
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
        <TurnHandoffOverlay
          combat={combat}
          tokens={displayScene.tokens}
          enabled={roomSettings.combatActive}
        />
        {combat && roomSettings.combatActive && (!hudToken || !hudVisible) ? (
          <EndTurnBar
            roomId={roomId}
            snapshot={snapshot}
            combat={combat}
            tokens={displayScene.tokens}
            canEndTurn={canEndTurn || canControlCombat}
            isGm={canControlCombat}
            onApplySnapshot={syncRoom}
          />
        ) : null}
        {(() => {
          if (!hudToken) return null;
          const layer =
            hudVisible ? (
              <CharacterCombatHud
                token={hudToken}
                sceneTokens={displayScene.tokens}
                snapshot={snapshot}
                combat={combat}
                isGmView={isRoomGm && !hudIsControlled}
                isControlled={hudIsControlled}
                canViewPa={canViewTokenPaFn(hudToken)}
                canEndTurn={canEndTurn || canControlCombat}
                canControlCombat={canControlCombat}
                roomId={roomId}
                onOpenSheet={onOpenSheet}
                onOpenMonsterSheet={onOpenMonsterSheet}
                onApplySnapshot={syncRoom}
                onHide={() => setHudVisible(false)}
                portraitFallback={hudPortraitFallback}
                portraitFocus={focusByTokenId.get(hudToken.id)}
              />
            ) : (
              <CombatHudRestoreButton token={hudToken} onShow={() => setHudVisible(true)} />
            );
          if (foundryLayout && hudOverlayRoot) {
            return createPortal(layer, hudOverlayRoot);
          }
          return layer;
        })()}
        {showHoverMiniHud && hoverMiniHudToken && hoverMiniHudAnchor
          ? (() => {
              const miniHud = (
                <TokenHoverMiniHud
                  token={hoverMiniHudToken}
                  combat={combat}
                  anchor={hoverMiniHudAnchor}
                  isGm={isRoomGm}
                  viewerToken={playerToken}
                  showMonsterHpToPlayers={roomSettings.showMonsterHpToPlayers}
                  showMovement={highlights.turnMovePreview}
                  showMonsterInfoHint={
                    canViewMonsterKnowledge && isMonsterToken(hoverMiniHudToken)
                  }
                />
              );
              if (foundryLayout && hudOverlayRoot) {
                return createPortal(miniHud, hudOverlayRoot);
              }
              return miniHud;
            })()
          : null}
        {monsterKnowledgeToken && roomId ? (
          <div className="vtt-monster-knowledge-wrap">
            <MonsterKnowledgePanel
              token={monsterKnowledgeToken}
              adventureId={adventureIdProp ?? roomId}
              roomId={roomId}
              simulatePlayerView={simulatePlayerView}
              onClose={closeMonsterKnowledge}
            />
          </div>
        ) : null}
        {playerBestiaryTarget && roomId ? (
          <div className="vtt-monster-knowledge-wrap">
            <PlayerBestiaryGmPanel
              token={playerBestiaryTarget.token}
              playerUserId={playerBestiaryTarget.ownerId}
              adventureId={adventureIdProp ?? roomId}
              roomId={roomId}
              onClose={closePlayerBestiary}
            />
          </div>
        ) : null}
        <BattlefieldActionHud
          preview={actionPreview}
          anchor={actionPreviewAnchor}
          targetToken={targetingHoverTarget}
          isGm={isRoomGm}
          viewerToken={playerToken}
          showMonsterHpToPlayers={roomSettings.showMonsterHpToPlayers}
        />
        <BattlefieldCombatFxHost
          wrapRef={wrapRef}
          combatFxGrid={combatFxGrid}
          view={battlefieldView.view}
          fx={combatFx}
          tokens={displayScene.tokens}
          onApplyState={onCombatApplyState}
          onTokenFlash={onCombatTokenFlash}
          onTokenCastFx={onTokenCastFx}
          onChatReveal={onCombatChatReveal}
          onDone={onCombatFxDone}
        />
        <TokenGmHpDialog
          open={gmHpEditTokenId !== null}
          token={
            gmHpEditTokenId
              ? (displayScene.tokens.find((t) => t.id === gmHpEditTokenId) ?? null)
              : null
          }
          roomId={roomId}
          onClose={() => setGmHpEditTokenId(null)}
          onApplied={(payload) => syncRoom(payload, { force: true })}
        />
        <FriendlyFireConfirmDialog
          open={friendlyFireTargetId !== null}
          attacker={selected}
          defender={friendlyFireDefender}
          busy={friendlyFireBusy}
          onConfirm={() => void confirmFriendlyFire()}
          onCancel={() => {
            if (!friendlyFireBusy) setFriendlyFireTargetId(null);
          }}
        />
        <DeleteTokenConfirmDialog
          open={deleteTokenConfirmOpen}
          token={selected}
          isOnTurn={Boolean(
            combat && selectedId && activeTokenId(combat) === selectedId
          )}
          busy={deleteTokenBusy}
          onConfirm={() => void removeSelectedToken()}
          onCancel={() => {
            if (!deleteTokenBusy) setDeleteTokenConfirmOpen(false);
          }}
        />
        {isMultiTargetSpell(activeCombatAction) && isTargetMode(actionMode) ? (
          <SpellTargetConfirmBar
            spellName={activeCombatAction!.name}
            picked={spellTargetIds.length}
            max={spellTargetCount(activeCombatAction!)}
            busy={spellTargetBusy}
            onConfirm={() => void executeMultiTargetCast(spellTargetIds)}
            onCancel={() => {
              setSpellTargetIds([]);
              setActionMode("idle");
              setSelectedCombatAction(null);
              setActionErr(null);
            }}
          />
        ) : null}
      </BattlefieldMapCanvas>
    </div>
  );
}
