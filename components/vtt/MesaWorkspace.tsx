"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  canAdvanceCombatTurn,
  canControlToken as canControlTokenCheck,
  canViewTokenPa,
} from "@/lib/auth/combat-turn-access";
import { canBypassCombatTurn, canParticipateInRoom } from "@/lib/auth/room-access";
import { normalizeRoomSettings } from "@/lib/room/settings";
import type { SessionUser } from "@/lib/auth/types";
import type { BattleScene } from "@/lib/vtt/types";
import type { RpgSystemId } from "@/lib/rpg/systems";
import type { Axial } from "@/lib/vtt/grid-math";
import { useCombatModeTransition } from "@/hooks/vtt/useCombatModeTransition";
import { CombatModeTransition } from "@/components/vtt/CombatModeTransition";
import "@/components/vtt/combat-mode-transition.css";
import { useFoundryWindows, FOUNDRY_DOCK_PANEL_IDS, type MesaWindowId } from "@/hooks/vtt/useFoundryWindows";
import { MAX_CHARACTERS_PER_USER_PER_ADVENTURE } from "@/lib/character/adventure-bind";
import { useGmPlayerViewMode } from "@/hooks/vtt/useGmPlayerViewMode";
import type { RoomSnapshot } from "@/lib/room/types";
import type { RoomMemberOnlineEvent, RoomApiPayload, RoomSyncBridge } from "@/hooks/useRoomSync";
import { MesaSyncProvider, useMesaSyncActions } from "@/components/vtt/MesaSyncProvider";
import {
  useMesaActors,
  useMesaMapSnapshot,
  useMesaMeta,
  useMesaSettings,
} from "@/hooks/vtt/useMesaRoomSlice";
import { getMesaRoomStore } from "@/hooks/vtt/mesa-room-store";
import { MesaBattlefieldStage } from "@/components/vtt/mesa/MesaBattlefieldStage";
import { MesaCombatChatRevealBridge } from "@/components/vtt/mesa/MesaCombatChatRevealBridge";
import { MesaCombatFlowHost } from "@/components/vtt/mesa/MesaCombatFlowHost";
import { MesaFoundryDockRail } from "@/components/vtt/mesa/MesaFoundryDockRail";
import { MesaFoundryFloatingWindows } from "@/components/vtt/mesa/MesaFoundryFloatingWindows";
import { MesaFoundryStageHeader } from "@/components/vtt/mesa/MesaFoundryStageHeader";
import { usePassTurn } from "@/hooks/vtt/usePassTurn";
import { scheduleCombatDiceWarm } from "@/lib/vtt/dice-combat-box";
import { useRoomPresence } from "@/hooks/useRoomPresence";
import { MesaPresenceAlerts } from "@/components/vtt/MesaPresenceAlerts";
import { RoomInviteBar } from "@/components/vtt/RoomInviteBar";
import { MesaPersistenceNotice } from "@/components/vtt/MesaPersistenceNotice";
import { MesaMobileBar } from "@/components/vtt/MesaMobileBar";
import { RoomCoverBackdrop } from "@/components/vtt/RoomCoverBackdrop";
import {
  mergePortraitPatchIntoSnapshot,
  type RoomActorPatchResult,
} from "@/lib/character/portrait-persist-client";
import { VttToastProvider } from "@/components/vtt/VttToast";
import { useSheetPdfDeepLink } from "@/hooks/useSheetPdfDeepLink";
import "@/components/vtt/foundry/foundry.css";

type Props = {
  roomId: string;
  adventureId: string;
  roomOwnerId: string;
  memberIds: string[];
  scene: BattleScene;
  /** Sistema de RPG desta mesa — decide qual wizard/ficha renderizar. Default "eldarin". */
  rpgSystemId?: RpgSystemId;
  canEdit: boolean;
  canControlCombat: boolean;
  canChat?: boolean;
  inviteCode?: string | null;
  roomInviteCode?: string | null;
  roomInviteRoomId?: string | null;
  roomName?: string;
  isRoomOwner?: boolean;
  session: SessionUser | null;
  defaultActorId?: string;
  adventureName?: string;
  characterSlotsLeft?: number;
  charactersInAdventure?: number;
  openCharacterWizardOnLoad?: boolean;
  watchOnly?: boolean;
  /** Snapshot SSR (Fase 4) — mesa interativa sem esperar 1º GET */
  initialSnapshot?: RoomSnapshot | null;
  memberOnlineRef?: import("react").MutableRefObject<((event: RoomMemberOnlineEvent) => void) | null>;
};

export function MesaWorkspace(props: Props) {
  const presenceUser =
    props.session &&
    canParticipateInRoom(
      { roomId: props.roomId, ownerId: props.roomOwnerId, memberIds: props.memberIds },
      props.session
    )
      ? {
          id: props.session.id,
          name: props.session.nickname?.trim() || props.session.name,
          avatarUrl: props.session.avatarUrl ?? props.session.oauthAvatarUrl ?? null,
        }
      : null;

  const memberOnlineRef = useRef<((event: RoomMemberOnlineEvent) => void) | null>(null);

  return (
    <MesaSyncProvider
      roomId={props.roomId}
      inviteCode={props.inviteCode}
      initialSnapshot={props.initialSnapshot}
      presenceUser={presenceUser}
      onMemberOnline={(event) => memberOnlineRef.current?.(event)}
    >
      <MesaWorkspaceInner {...props} memberOnlineRef={memberOnlineRef} />
    </MesaSyncProvider>
  );
}

function MesaWorkspaceInner({
  roomId,
  adventureId,
  roomOwnerId,
  memberIds,
  scene,
  rpgSystemId = "eldarin",
  canEdit,
  canControlCombat,
  canChat = true,
  inviteCode = null,
  roomInviteCode = null,
  roomInviteRoomId = null,
  roomName,
  isRoomOwner = false,
  session,
  defaultActorId = "pc-thrain-ferroescudo",
  adventureName,
  characterSlotsLeft = 0,
  charactersInAdventure = 0,
  openCharacterWizardOnLoad = false,
  watchOnly = false,
  initialSnapshot = null,
  memberOnlineRef,
}: Props) {
  const shareRoomId = roomInviteRoomId ?? roomId;
  const isActualGm = canControlCombat;
  const showInviteUi = Boolean(isActualGm && roomInviteCode && roomInviteRoomId);
  const { playAsPlayer, togglePlayAsPlayer, effectiveIsGm } = useGmPlayerViewMode(
    roomId,
    isActualGm
  );
  const effectiveCanControlCombat = effectiveIsGm;
  const combatAccessOpts = useMemo(
    () => ({ simulatePlayerView: playAsPlayer }),
    [playAsPlayer]
  );

  const [sheetPopupActorId, setSheetPopupActorId] = useState<string | null>(null);
  const [torSheetId, setTorSheetId] = useState<string | null>(null);
  const [monsterSheetEntryId, setMonsterSheetEntryId] = useState<string | null>(null);
  const [characterWizardOpen, setCharacterWizardOpen] = useState(false);
  const [spawnAxial, setSpawnAxial] = useState<Axial | null>(null);
  const [combatChatReveal, setCombatChatReveal] = useState<
    Record<string, import("@/lib/combat/chat-display").CombatChatRevealPhase>
  >({});
  const memberOnlineRefLocal = useRef<((event: RoomMemberOnlineEvent) => void) | null>(null);
  const wizardAutoOpenedRef = useRef(false);
  const mapSnapshot = useMesaMapSnapshot(roomId);
  const mesaActors = useMesaActors(roomId);
  const mesaSettingsRaw = useMesaSettings(roomId);
  const { syncError, syncStatus } = useMesaMeta(roomId);
  const { refresh, applySnapshot, applyRoomResponse } = useMesaSyncActions();
  const snapshot = mapSnapshot;

  const presenceUser =
    session && canParticipateInRoom({ roomId, ownerId: roomOwnerId, memberIds }, session)
      ? {
          id: session.id,
          name: session.nickname?.trim() || session.name,
          avatarUrl: session.avatarUrl ?? session.oauthAvatarUrl ?? null,
        }
      : null;
  const {
    online: presenceOnline,
    loading: presenceLoading,
    handleMemberOnline,
    ownerDisplayNames,
  } = useRoomPresence({
    roomId,
    inviteCode,
    presenceUser,
    isRoomOwner: isActualGm,
  });

  useEffect(() => {
    const bridge = memberOnlineRef ?? memberOnlineRefLocal;
    bridge.current = (event: RoomMemberOnlineEvent) => {
      handleMemberOnline(event);
    };
    return () => {
      bridge.current = null;
    };
  }, [handleMemberOnline, memberOnlineRef]);
  const applyActionSnapshot = useCallback(
    (payload: RoomApiPayload, opts?: { force?: boolean; immediate?: boolean }) =>
      applyRoomResponse(payload, {
        force: opts?.force ?? true,
        immediate: opts?.immediate ?? false,
      }),
    [applyRoomResponse]
  );

  const roomSyncBridgeRef = useRef<RoomSyncBridge>({
    snapshot: null,
    refresh: async () => {},
    applySnapshot: () => {},
  });
  roomSyncBridgeRef.current.snapshot = getMesaRoomStore(roomId).getSnapshotFull();
  roomSyncBridgeRef.current.refresh = refresh;
  roomSyncBridgeRef.current.applySnapshot = applySnapshot;

  const diceWarmStartedRef = useRef(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scheduleCombatDiceWarm(reduced);
  }, []);

  useEffect(() => {
    if (!snapshot?.settings?.combatActive || diceWarmStartedRef.current) return;
    diceWarmStartedRef.current = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    void import("@/lib/vtt/dice-combat-box").then(({ warmCombatDiceBoxes }) =>
      warmCombatDiceBoxes(reduced)
    );
  }, [snapshot?.settings?.combatActive]);

  useEffect(() => {
    if (watchOnly || !session?.id) return;
    let cancelled = false;
    const runSync = () => {
      const q = inviteCode?.trim() ? `?invite=${encodeURIComponent(inviteCode.trim())}` : "";
      void fetch(`/api/room/${roomId}/sync-actors${q}`, {
        method: "POST",
        credentials: "same-origin",
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { revision?: number } | null) => {
          if (
            !cancelled &&
            data?.revision != null &&
            data.revision > (snapshot?.revision ?? 0)
          ) {
            void refresh();
          }
        })
        .catch(() => {
          /* sync em background — mesa segue com snapshot inicial */
        });
    };
    let idleId: number | ReturnType<typeof setTimeout> | undefined;
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = (
        window as Window & {
          requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
        }
      ).requestIdleCallback(runSync, { timeout: 8000 });
    } else {
      idleId = setTimeout(runSync, 6000);
    }
    return () => {
      cancelled = true;
      if (typeof idleId === "number" && typeof window !== "undefined" && "requestIdleCallback" in window) {
        (
          window as Window & { cancelIdleCallback: (id: number) => void }
        ).cancelIdleCallback(idleId);
      } else if (idleId != null) {
        clearTimeout(idleId as ReturnType<typeof setTimeout>);
      }
    };
  }, [roomId, inviteCode, watchOnly, session?.id, refresh, snapshot?.revision]);

  const { passTurn: passMobileTurn, busy: mobileEndTurnBusy } = usePassTurn(
    roomId,
    snapshot,
    applyActionSnapshot
  );

  const windows = useFoundryWindows(roomId);
  const { close: closeWindow } = windows;

  const GM_ONLY_WINDOW_IDS: MesaWindowId[] = ["spawn", "dungeon", "gm"];

  useEffect(() => {
    if (!playAsPlayer) return;
    for (const id of GM_ONLY_WINDOW_IDS) {
      closeWindow(id);
    }
  }, [playAsPlayer, closeWindow]);

  const openSheet = useCallback(
    (actorId?: string) => {
      const id = actorId ?? defaultActorId;
      setSheetPopupActorId(id);
      windows.openAsPopup("character");
      windows.focus("character");
    },
    [defaultActorId, windows]
  );

  const closeSheet = useCallback(() => {
    setSheetPopupActorId(null);
    windows.close("character");
  }, [windows]);

  const openTorSheet = useCallback(
    (characterId: string) => {
      setTorSheetId(characterId);
      windows.openAsPopup("torFicha");
      windows.focus("torFicha");
    },
    [windows]
  );

  const closeTorSheet = useCallback(() => {
    setTorSheetId(null);
    windows.close("torFicha");
  }, [windows]);

  const handleRoomPortraitPatch = useCallback(
    (result: RoomActorPatchResult) => {
      const full = getMesaRoomStore(roomId).getSnapshotFull();
      if (!full) {
        void refresh();
        return;
      }
      applySnapshot(mergePortraitPatchIntoSnapshot(full, result), { force: true });
    },
    [applySnapshot, refresh, roomId]
  );

  const openMonsterSheet = useCallback(
    (entryId: string) => {
      const id = entryId.trim();
      if (!id) return;
      setMonsterSheetEntryId(id);
      windows.openAsPopup("monsterSheet");
      windows.focus("monsterSheet");
    },
    [windows]
  );

  const closeMonsterSheet = useCallback(() => {
    setMonsterSheetEntryId(null);
    windows.close("monsterSheet");
  }, [windows]);

  const openCharacterWizard = useCallback(() => {
    setCharacterWizardOpen(true);
    windows.openAsPopup("createCharacter");
    windows.focus("createCharacter");
  }, [windows]);

  const closeCharacterWizard = useCallback(() => {
    setCharacterWizardOpen(false);
    windows.close("createCharacter");
  }, [windows]);

  const handleCharacterCreated = useCallback(
    async (result: { characterId: string }) => {
      closeCharacterWizard();
      // Fichas do Um Anel não viram RoomActor (Fase 4/combate) — abrem no popup próprio,
      // sem passar pelo refresh de mesaActors (que é 100% Eldarin).
      if (result.characterId.startsWith("tor-")) {
        openTorSheet(result.characterId);
        return;
      }
      await refresh();
      openSheet(result.characterId);
    },
    [closeCharacterWizard, refresh, openSheet, openTorSheet]
  );

  const openDungeonPanel = useCallback(() => {
    windows.openAsPopup("dungeon");
  }, [windows]);

  const onCombatChatReveal = useCallback(
    (messageIds: string[], phase: "roll" | "damage" | "done") => {
      setCombatChatReveal((prev) => {
        const next = { ...prev };
        for (const id of messageIds) {
          if (phase === "done") delete next[id];
          else next[id] = phase;
        }
        return next;
      });
    },
    []
  );

  useEffect(() => {
    setCombatChatReveal({});
  }, [roomId]);

  const turnRoom = useMemo(
    () => ({
      roomId,
      ownerId: roomOwnerId,
      memberIds,
      scene: snapshot?.scene ?? scene,
      actors: mesaActors,
    }),
    [roomId, roomOwnerId, memberIds, snapshot, scene, mesaActors]
  );

  const canControlToken = useCallback(
    (token: import("@/lib/vtt/types").BattleToken) =>
      canControlTokenCheck(turnRoom, session, token, combatAccessOpts),
    [turnRoom, session, combatAccessOpts]
  );

  const canViewTokenPaCb = useCallback(
    (token: import("@/lib/vtt/types").BattleToken) =>
      canViewTokenPa(turnRoom, session, token, combatAccessOpts),
    [turnRoom, session, combatAccessOpts]
  );

  const canEndTurn = useMemo(() => {
    if (!snapshot?.combat?.order?.length) return false;
    return canAdvanceCombatTurn(turnRoom, session, snapshot.combat, combatAccessOpts);
  }, [snapshot?.combat, session, turnRoom, combatAccessOpts]);

  const canParticipate = useMemo(
    () =>
      canParticipateInRoom(
        { roomId, ownerId: roomOwnerId, memberIds },
        session
      ),
    [
      roomId,
      roomOwnerId,
      memberIds,
      session,
    ]
  );

  const canCreateCharacter = useMemo(() => {
    if (!canParticipateInRoom({ roomId, ownerId: roomOwnerId, memberIds }, session)) {
      return false;
    }
    if (characterSlotsLeft <= 0) return false;
    if (charactersInAdventure >= MAX_CHARACTERS_PER_USER_PER_ADVENTURE) return false;
    return true;
  }, [roomId, roomOwnerId, memberIds, session, characterSlotsLeft, charactersInAdventure]);

  useEffect(() => {
    if (wizardAutoOpenedRef.current) return;
    if (!openCharacterWizardOnLoad || !canCreateCharacter) return;
    wizardAutoOpenedRef.current = true;
    openCharacterWizard();
  }, [openCharacterWizardOnLoad, canCreateCharacter, openCharacterWizard]);

  const roomSettings = useMemo(
    () => normalizeRoomSettings(mesaSettingsRaw ?? snapshot?.settings),
    [mesaSettingsRaw, snapshot?.settings]
  );

  const combatActive = roomSettings.combatActive;
  const { phase: combatModePhase, locked: mesaTransitionLocked } =
    useCombatModeTransition(combatActive);

  const canBypassTurn = useMemo(() => {
    return canBypassCombatTurn(
      {
        ownerId: roomOwnerId,
        settings: roomSettings,
      },
      session
    );
  }, [roomOwnerId, roomSettings, session]);

  useSheetPdfDeepLink({
    roomId,
    combat: snapshot?.combat,
    tokens: snapshot?.scene.tokens ?? scene.tokens,
    actors: mesaActors,
    bypassTurn: canBypassTurn,
    openSheet,
    onRolled: refresh,
  });

  const win = windows.get;

  const allowedDockPanels = useMemo(() => {
    const ids = new Set<MesaWindowId>([
      "ficha",
      "chat",
      "dice",
      "status",
    ]);
    if (isActualGm) {
      ids.add("spawn");
      ids.add("gm");
      ids.add("dungeon");
    }
    if (showInviteUi) ids.add("invite");
    ids.add("initiative");
    return ids;
  }, [
    isActualGm,
    showInviteUi,
  ]);

  const dockOpen = windows.isDockOpen(allowedDockPanels);
  const mapScene = snapshot?.scene ?? scene;


  useEffect(() => {
    if (!windows.hydrated || !isActualGm) return;
    if (!roomSettings.combatActive) return;
    if (snapshot?.combat?.order?.length) return;
    if (windows.isActive("initiative")) return;
    windows.openAsPopup("initiative");
  }, [
    windows.hydrated,
    isActualGm,
    roomSettings.combatActive,
    snapshot?.combat?.order?.length,
    windows.isActive,
    windows.openAsPopup,
  ]);

  useEffect(() => {
    if (!windows.hydrated) return;
    const disallowed: MesaWindowId[] = [];
    for (const id of FOUNDRY_DOCK_PANEL_IDS) {
      if (!allowedDockPanels.has(id)) disallowed.push(id);
    }
    if (disallowed.length > 0) windows.closePanels(disallowed);
  }, [windows.hydrated, allowedDockPanels, windows.closePanels]);

  const isPanelActive = useCallback(
    (id: MesaWindowId) => windows.isActive(id),
    [windows]
  );

  const handleOpenDock = useCallback(
    (id: MesaWindowId) => {
      windows.openInDock(id);
    },
    [windows]
  );

  const handleOpenPopup = useCallback(
    (id: MesaWindowId) => {
      if (windows.isActive(id)) {
        windows.close(id);
        return;
      }
      windows.openAsPopup(id);
    },
    [windows]
  );

  const handleMobileEndTurn = useCallback(() => {
    void passMobileTurn();
  }, [passMobileTurn]);

  const openMobilePanel = useCallback(
    (id: MesaWindowId) => {
      windows.openAsPopup(id);
      windows.focus(id);
    },
    [windows]
  );

  return (
    <VttToastProvider>
      <MesaPresenceAlerts bridgeRef={memberOnlineRefLocal} selfUserId={session?.id} />
      <MesaCombatFlowHost roomId={roomId} />
      <MesaCombatChatRevealBridge roomId={roomId} onReveal={onCombatChatReveal} />
      <div className="mesa-workspace mesa-workspace--foundry">
        <div className="foundry-mesa">
          <MesaFoundryDockRail
            roomId={roomId}
            adventureId={adventureId}
            shareRoomId={shareRoomId}
            roomOwnerId={roomOwnerId}
            memberIds={memberIds}
            roomName={roomName}
            rpgSystemId={rpgSystemId}
            fallbackScene={scene}
            mapScene={mapScene}
            mesaActors={mesaActors}
            session={session}
            inviteCode={inviteCode}
            roomInviteCode={roomInviteCode}
            showInviteUi={showInviteUi}
            isRoomOwner={isRoomOwner}
            isActualGm={isActualGm}
            effectiveIsGm={effectiveIsGm}
            effectiveCanControlCombat={effectiveCanControlCombat}
            canChat={canChat}
            canCreateCharacter={canCreateCharacter}
            sheetPopupActorId={sheetPopupActorId}
            spawnAxial={spawnAxial}
            combatChatReveal={combatChatReveal}
            dockOpen={dockOpen}
            isPanelActive={isPanelActive}
            isFloating={windows.isFloating}
            win={win}
            onOpenDock={handleOpenDock}
            onOpenPopup={handleOpenPopup}
            onClosePanel={windows.close}
            onMinimizePanel={windows.minimize}
            onRestorePanel={windows.restore}
            onOpenSheet={openSheet}
            onOpenMonsterSheet={openMonsterSheet}
            onOpenCharacterWizard={canCreateCharacter ? openCharacterWizard : undefined}
            onRefresh={refresh}
            onApplySnapshot={applySnapshot}
          />

          <MesaPersistenceNotice />
          <div
            className={`foundry-mesa__stage${mesaTransitionLocked ? " foundry-mesa__stage--locked" : ""}${roomSettings.combatActive ? " foundry-mesa__stage--combat" : ""}`}
            onContextMenuCapture={(e) => e.preventDefault()}
            aria-busy={mesaTransitionLocked || undefined}
          >
            <RoomCoverBackdrop
              coverUrl={roomSettings.coverUrl}
              coverFocus={roomSettings.coverFocus}
            />
            {combatModePhase ? <CombatModeTransition phase={combatModePhase} /> : null}
            <MesaFoundryStageHeader
              roomId={roomId}
              adventureId={adventureId}
              mapSnapshot={snapshot}
              combatActive={roomSettings.combatActive}
              syncStatus={syncStatus}
              syncError={syncError}
              isActualGm={isActualGm}
              playAsPlayer={playAsPlayer}
              session={session}
              presenceOnline={presenceOnline}
              presenceLoading={presenceLoading}
              onRetrySync={() => void refresh()}
              onApplyUpdate={applyActionSnapshot}
              onTogglePlayAsPlayer={togglePlayAsPlayer}
            />
            <MesaBattlefieldStage
              roomId={roomId}
              adventureId={adventureId}
              rpgSystemId={rpgSystemId}
              roomOwnerId={roomOwnerId}
              memberIds={memberIds}
              fallbackScene={scene}
              canEdit={canEdit}
              effectiveCanControlCombat={effectiveCanControlCombat}
              isActualGm={isActualGm}
              effectiveIsGm={effectiveIsGm}
              playAsPlayer={playAsPlayer}
              canBypassTurn={canBypassTurn}
              canEndTurn={canEndTurn}
              inviteCode={inviteCode}
              session={session}
              watchOnly={watchOnly}
              ownerDisplayNames={ownerDisplayNames}
              canControlToken={canControlToken}
              canViewTokenPa={canViewTokenPaCb}
              onOpenSheet={openSheet}
              onOpenMonsterSheet={openMonsterSheet}
              onCreateCharacter={canCreateCharacter ? openCharacterWizard : undefined}
              onHoverAxialChange={setSpawnAxial}
              onOpenDungeonPanel={openDungeonPanel}
              onCombatChatReveal={onCombatChatReveal}
              gmWindowLayout={win("gm")}
              onGmWindowLayoutChange={(patch) => windows.patch("gm", patch)}
              onGmWindowClose={() => windows.close("gm")}
              onGmWindowMinimize={() =>
                win("gm").minimized ? windows.restore("gm") : windows.minimize("gm")
              }
              onGmWindowFocus={() => windows.focus("gm")}
              dungeonWindowLayout={win("dungeon")}
              onDungeonWindowLayoutChange={(patch) => windows.patch("dungeon", patch)}
              onDungeonWindowClose={() => windows.close("dungeon")}
              onDungeonWindowMinimize={() =>
                win("dungeon").minimized ? windows.restore("dungeon") : windows.minimize("dungeon")
              }
              onDungeonWindowFocus={() => windows.focus("dungeon")}
              initiativeWindowLayout={win("initiative")}
              onInitiativeWindowLayoutChange={(patch) => windows.patch("initiative", patch)}
              onInitiativeWindowClose={() => windows.close("initiative")}
              onInitiativeWindowMinimize={() =>
                win("initiative").minimized
                  ? windows.restore("initiative")
                  : windows.minimize("initiative")
              }
              onInitiativeWindowFocus={() => windows.focus("initiative")}
              statusWindowLayout={win("status")}
              onStatusWindowLayoutChange={(patch) => windows.patch("status", patch)}
              onStatusWindowClose={() => windows.close("status")}
              onStatusWindowMinimize={() =>
                win("status").minimized ? windows.restore("status") : windows.minimize("status")
              }
              onStatusWindowFocus={() => windows.focus("status")}
              onStatusDockOpen={() => windows.openInDock("status")}
              isWindowFloating={windows.isFloating}
            />
            <div id="foundry-mesa-toasts" className="foundry-mesa__toasts" aria-live="polite" />
            <div id="foundry-mesa-hud" className="foundry-mesa__hud">
              <div id="foundry-mesa-windows" className="foundry-mesa__windows">
                <MesaFoundryFloatingWindows
                  roomId={roomId}
                  adventureId={adventureId}
                  rpgSystemId={rpgSystemId}
                  shareRoomId={shareRoomId}
                  roomOwnerId={roomOwnerId}
                  memberIds={memberIds}
                  roomName={roomName}
                  adventureName={adventureName}
                  mapScene={mapScene}
                  mapSnapshot={snapshot}
                  mesaActors={mesaActors}
                  session={session}
                  roomInviteCode={roomInviteCode}
                  showInviteUi={showInviteUi}
                  isRoomOwner={isRoomOwner}
                  isActualGm={isActualGm}
                  effectiveIsGm={effectiveIsGm}
                  canChat={canChat}
                  canCreateCharacter={canCreateCharacter}
                  characterSlotsLeft={characterSlotsLeft}
                  sheetPopupActorId={sheetPopupActorId}
                  monsterSheetEntryId={monsterSheetEntryId}
                  setMonsterSheetEntryId={setMonsterSheetEntryId}
                  characterWizardOpen={characterWizardOpen}
                  torSheetId={torSheetId}
                  onOpenTorSheet={openTorSheet}
                  onCloseTorSheet={closeTorSheet}
                  spawnAxial={spawnAxial}
                  combatChatReveal={combatChatReveal}
                  roomSyncBridge={roomSyncBridgeRef.current}
                  isFloating={windows.isFloating}
                  win={win}
                  onPatchWindow={windows.patch}
                  onFocusWindow={windows.focus}
                  onCloseWindow={windows.close}
                  onRestoreWindow={windows.restore}
                  onMinimizeWindow={windows.minimize}
                  onOpenSheet={openSheet}
                  onCloseSheet={closeSheet}
                  onOpenMonsterSheet={openMonsterSheet}
                  onCloseMonsterSheet={closeMonsterSheet}
                  onOpenCharacterWizard={canCreateCharacter ? openCharacterWizard : undefined}
                  onCloseCharacterWizard={closeCharacterWizard}
                  onCharacterCreated={(result) => void handleCharacterCreated(result)}
                  onRefresh={refresh}
                  onApplySnapshot={applySnapshot}
                  onRoomPortraitPatch={handleRoomPortraitPatch}
                />
              </div>
            </div>
          </div>

          <MesaMobileBar
            onOpenChat={() => openMobilePanel("chat")}
            onOpenInitiative={() => openMobilePanel("initiative")}
            onOpenDice={() => openMobilePanel("dice")}
            onEndTurn={() => void handleMobileEndTurn()}
            canEndTurn={canEndTurn || effectiveCanControlCombat}
            canRollDice={canChat}
            endTurnBusy={mobileEndTurnBusy}
            combatActive={roomSettings.combatActive}
          />
        </div>
      </div>
    </VttToastProvider>
  );
}
