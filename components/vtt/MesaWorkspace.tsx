"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isStagedCombatChatMessage } from "@/lib/combat/chat-display";
import {
  canAdvanceCombatTurn,
  canControlToken as canControlTokenCheck,
  canViewTokenPa,
} from "@/lib/auth/combat-turn-access";
import { canBypassCombatTurn, canParticipateInRoom } from "@/lib/auth/room-access";
import { normalizeRoomSettings } from "@/lib/room/settings";
import type { SessionUser } from "@/lib/auth/types";
import type { CompendiumEntry, CompendiumPackId } from "@/lib/compendium/types";
import { getPackEntries, getVisiblePacks } from "@/lib/compendium/registry";
import type { BattleScene } from "@/lib/vtt/types";
import type { Axial } from "@/lib/vtt/grid-math";
import { useCombatTurnFlow } from "@/hooks/vtt/useCombatTurnFlow";
import { useCombatModeTransition } from "@/hooks/vtt/useCombatModeTransition";
import { CombatModeTransition } from "@/components/vtt/CombatModeTransition";
import "@/components/vtt/combat-mode-transition.css";
import { useFoundryWindows, FOUNDRY_DOCK_PANEL_IDS, type MesaWindowId } from "@/hooks/vtt/useFoundryWindows";
import { MAX_CHARACTERS_PER_USER_PER_ADVENTURE } from "@/lib/character/adventure-bind";
import { useGmPlayerViewMode } from "@/hooks/vtt/useGmPlayerViewMode";
import type { RoomSnapshot } from "@/lib/room/types";
import { useRoomSync, type RoomMemberOnlineEvent, type RoomApiPayload } from "@/hooks/useRoomSync";
import { usePassTurn } from "@/hooks/vtt/usePassTurn";
import { preloadCombatDiceBox } from "@/lib/vtt/dice-combat-box";
import { useRoomPresence } from "@/hooks/useRoomPresence";
import { MesaPresenceAlerts } from "@/components/vtt/MesaPresenceAlerts";
import { MesaOnlineMenu } from "@/components/vtt/MesaOnlineMenu";
import { MesaEditRequestsBell } from "@/components/vtt/MesaEditRequestsBell";
import { MesaPlayerEditRequestsBell } from "@/components/vtt/MesaPlayerEditRequestsBell";
import { MesaPlayerInventoryRequestsBell } from "@/components/vtt/MesaPlayerInventoryRequestsBell";
import { GmPlayerViewToggle } from "@/components/vtt/GmPlayerViewToggle";
import { GmMesaModeToggle, MesaModeIndicator } from "@/components/vtt/GmMesaModeToggle";
import { VttToastProvider } from "@/components/vtt/VttToast";
import { FoundryDockPanel } from "@/components/vtt/foundry/FoundryDockPanel";
import { FoundryWindow } from "@/components/vtt/foundry/FoundryWindow";
import { MesaFoundrySidebar } from "@/components/vtt/foundry/MesaFoundrySidebar";
import { Battlefield } from "@/components/vtt/Battlefield";
import { MonsterSheetPopup } from "@/components/compendium/MonsterSheetPopup";
import { CharacterSheetPopup } from "@/components/vtt/CharacterSheetPopup";
import {
  mergePortraitPatchIntoSnapshot,
  type RoomActorPatchResult,
} from "@/lib/character/portrait-persist-client";
import { MesaCharacterWizardPopup } from "@/components/vtt/MesaCharacterWizardPopup";
import { PlayableCharactersPanel } from "@/components/vtt/PlayableCharactersPanel";
import { RoomChat } from "@/components/vtt/RoomChat";
import { DiceRoller } from "@/components/vtt/DiceRoller";
import { MonsterSpawnPanel } from "@/components/vtt/MonsterSpawnPanel";
import { RoomInvitePanel } from "@/components/vtt/RoomInvitePanel";
import { RoomInviteBar } from "@/components/vtt/RoomInviteBar";
import { MesaPersistenceNotice } from "@/components/vtt/MesaPersistenceNotice";
import { DemoGuidedTour } from "@/components/vtt/DemoGuidedTour";
import { MesaGuidedTour } from "@/components/vtt/MesaGuidedTour";
import { MesaMobileBar } from "@/components/vtt/MesaMobileBar";
import { RoomCoverBackdrop } from "@/components/vtt/RoomCoverBackdrop";
import { useSheetPdfDeepLink } from "@/hooks/useSheetPdfDeepLink";
import "@/components/vtt/foundry/foundry.css";

type Props = {
  roomId: string;
  adventureId: string;
  roomOwnerId: string;
  memberIds: string[];
  scene: BattleScene;
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
};

export function MesaWorkspace({
  roomId,
  adventureId,
  roomOwnerId,
  memberIds,
  scene,
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
}: Props) {
  const shareRoomId = roomInviteRoomId ?? roomId;
  const isActualGm = canControlCombat;
  const showInviteUi = Boolean(isActualGm && roomInviteCode && roomInviteRoomId);
  const { playAsPlayer, togglePlayAsPlayer, effectiveIsGm } = useGmPlayerViewMode(
    roomId,
    isActualGm
  );
  const effectiveCanControlCombat = effectiveIsGm;
  const compendium = useMemo(() => {
    const role = session?.role ?? null;
    const packs = getVisiblePacks(role, { isRoomGm: effectiveIsGm });
    return Object.fromEntries(
      packs.map((p) => [p.id, getPackEntries(p.id, { role, isRoomGm: effectiveIsGm })])
    ) as Record<CompendiumPackId, CompendiumEntry[]>;
  }, [session?.role, effectiveIsGm]);
  const combatAccessOpts = useMemo(
    () => ({ simulatePlayerView: playAsPlayer }),
    [playAsPlayer]
  );

  const [sheetPopupActorId, setSheetPopupActorId] = useState<string | null>(null);
  const [monsterSheetEntryId, setMonsterSheetEntryId] = useState<string | null>(null);
  const [characterWizardOpen, setCharacterWizardOpen] = useState(false);
  const [spawnAxial, setSpawnAxial] = useState<Axial | null>(null);
  const [combatChatReveal, setCombatChatReveal] = useState<
    Record<string, import("@/lib/combat/chat-display").CombatChatRevealPhase>
  >({});
  const memberOnlineRef = useRef<((event: RoomMemberOnlineEvent) => void) | null>(null);
  const wizardAutoOpenedRef = useRef(false);
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
  const { snapshot, syncError, syncStatus, refresh, applySnapshot, applyRoomResponse } = useRoomSync(roomId, {
    inviteCode,
    initialSnapshot,
    presenceUser,
    onMemberOnline: (event) => {
      memberOnlineRef.current?.(event);
      handleMemberOnline(event);
    },
  });
  const applyActionSnapshot = useCallback(
    (payload: RoomApiPayload, opts?: { force?: boolean; immediate?: boolean }) =>
      applyRoomResponse(payload, { force: opts?.force ?? true, immediate: opts?.immediate ?? true }),
    [applyRoomResponse]
  );
  const { passTurn: passMobileTurn, busy: mobileEndTurnBusy } = usePassTurn(
    roomId,
    snapshot,
    applyActionSnapshot
  );

  useEffect(() => {
    if (snapshot?.settings?.combatActive) preloadCombatDiceBox();
  }, [snapshot?.settings?.combatActive]);

  useEffect(() => {
    if (roomId === "demo" || watchOnly || !session?.id) return;
    const q = inviteCode?.trim() ? `?invite=${encodeURIComponent(inviteCode.trim())}` : "";
    let cancelled = false;
    void fetch(`/api/room/${roomId}/sync-actors${q}`, {
      method: "POST",
      credentials: "same-origin",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { revision?: number } | null) => {
        if (!cancelled && data?.revision != null) void refresh();
      })
      .catch(() => {
        /* sync em background — mesa segue com snapshot inicial */
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, inviteCode, watchOnly, session?.id, refresh]);

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

  const handleRoomPortraitPatch = useCallback(
    (result: RoomActorPatchResult) => {
      if (!snapshot) {
        void refresh();
        return;
      }
      applySnapshot(mergePortraitPatchIntoSnapshot(snapshot, result), { force: true });
    },
    [applySnapshot, refresh, snapshot]
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
      await refresh();
      openSheet(result.characterId);
    },
    [closeCharacterWizard, refresh, openSheet]
  );

  const openDungeonPanel = useCallback(() => {
    windows.openAsPopup("dungeon");
  }, [windows]);

  const chat = snapshot?.chat ?? [];

  const combatChatSeenRef = useRef<Set<string>>(new Set());
  const combatChatSeededRef = useRef(false);

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
    combatChatSeededRef.current = false;
    combatChatSeenRef.current = new Set();
    setCombatChatReveal({});
  }, [roomId]);

  useEffect(() => {
    const msgs = snapshot?.chat ?? [];
    if (!combatChatSeededRef.current) {
      for (const m of msgs) {
        if (isStagedCombatChatMessage(m)) combatChatSeenRef.current.add(m.id);
      }
      combatChatSeededRef.current = true;
      return;
    }
    const freshIds: string[] = [];
    for (const m of msgs) {
      if (!isStagedCombatChatMessage(m)) continue;
      if (!combatChatSeenRef.current.has(m.id)) {
        freshIds.push(m.id);
        combatChatSeenRef.current.add(m.id);
      }
    }
    if (freshIds.length) onCombatChatReveal(freshIds, "roll");
  }, [snapshot?.revision, onCombatChatReveal]);

  const turnRoom = useMemo(
    () => ({
      roomId,
      ownerId: roomOwnerId,
      memberIds,
      scene: snapshot?.scene ?? scene,
      actors: snapshot?.actors ?? {},
    }),
    [roomId, roomOwnerId, memberIds, snapshot, scene]
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
    if (roomId === "demo") return false;
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
    () => normalizeRoomSettings(snapshot?.settings),
    [snapshot?.settings]
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
    actors: snapshot?.actors,
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
      <MesaPresenceAlerts bridgeRef={memberOnlineRef} selfUserId={session?.id} />
      <MesaWorkspaceCombatFlow
        snapshot={snapshot}
        roomId={roomId}
        onSnapshot={applyActionSnapshot}
      />
      <div className="mesa-workspace mesa-workspace--foundry">
        {syncError ? (
          <p className="mesa-sync-err" role="alert">
            {syncError}{" "}
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: "0.8rem" }}
              onClick={() => refresh()}
            >
              Tentar de novo
            </button>
          </p>
        ) : (
          <p
            className={`mesa-sync-status mesa-sync-status--${syncStatus}`}
            aria-live="polite"
            title="Estado da conexão ao vivo com a mesa"
          >
            {syncStatus === "loading"
              ? "Carregando mesa…"
              : syncStatus === "live"
                ? "Ao vivo"
                : syncStatus === "polling"
                  ? "Reconectando…"
                  : null}
          </p>
        )}


        <div className="foundry-mesa">
          <MesaFoundrySidebar
            isActive={isPanelActive}
            onOpenDock={handleOpenDock}
            onOpenPopup={handleOpenPopup}
            showGm={effectiveCanControlCombat}
            showInvite={showInviteUi}
            dockOpen={dockOpen}
          >
            {!windows.isFloating("chat") ? (
              <FoundryDockPanel
                title="Chat"
                open={win("chat").open}
                minimized={win("chat").minimized}
                className="foundry-dock-panel--chat"
                onClose={() => windows.close("chat")}
                onMinimize={() =>
                  win("chat").minimized ? windows.restore("chat") : windows.minimize("chat")
                }
              >
                <RoomChat
                  roomId={roomId}
                  messages={chat}
                  tokens={scene.tokens}
                  combatReveal={combatChatReveal}
                  onUpdate={refresh}
                  readOnly={!canChat}
                />
              </FoundryDockPanel>
            ) : null}

            {!windows.isFloating("ficha") ? (
              <FoundryDockPanel
                title="Personagens jogáveis"
                open={win("ficha").open}
                minimized={win("ficha").minimized}
                className="foundry-dock-panel--ficha"
                onClose={() => windows.close("ficha")}
                onMinimize={() =>
                  win("ficha").minimized ? windows.restore("ficha") : windows.minimize("ficha")
                }
              >
                <div className="mesa-panel-scroll mesa-panel-scroll--rail">
                  <PlayableCharactersPanel
                    roomId={roomId}
                    adventureId={adventureId}
                    actors={snapshot?.actors ?? {}}
                    session={session}
                    selectedActorId={sheetPopupActorId}
                    canCreateCharacter={canCreateCharacter}
                    isRoomGm={effectiveIsGm}
                    roomOwnerId={roomOwnerId}
                    memberIds={memberIds}
                    tokens={snapshot?.scene.tokens ?? scene.tokens}
                    spawnAxial={spawnAxial}
                    onOpenSheet={openSheet}
                    onCharactersChanged={refresh}
                    onCreateCharacter={canCreateCharacter ? openCharacterWizard : undefined}
                    onPlaced={applySnapshot}
                  />
                </div>
              </FoundryDockPanel>
            ) : null}

            {showInviteUi && !windows.isFloating("invite") ? (
              <FoundryDockPanel
                title="Compartilhar mesa"
                open={win("invite").open}
                minimized={win("invite").minimized}
                className="foundry-dock-panel--invite"
                onClose={() => windows.close("invite")}
                onMinimize={() =>
                  win("invite").minimized ? windows.restore("invite") : windows.minimize("invite")
                }
              >
                <div className="mesa-panel-scroll mesa-panel-scroll--invite">
                  <RoomInvitePanel
                    adventureId={adventureId}
                    roomId={shareRoomId}
                    inviteCode={roomInviteCode!}
                    roomName={roomName ?? snapshot?.scene.name ?? "Mesa"}
                    showConfigure={isRoomOwner}
                  />
                </div>
              </FoundryDockPanel>
            ) : null}

            {!windows.isFloating("dice") ? (
              <FoundryDockPanel
                title="Rolador de dados"
                open={win("dice").open}
                minimized={win("dice").minimized}
                className="foundry-dock-panel--dice"
                onClose={() => windows.close("dice")}
                onMinimize={() =>
                  win("dice").minimized ? windows.restore("dice") : windows.minimize("dice")
                }
              >
                {canChat ? (
                  <DiceRoller roomId={roomId} onUpdate={refresh} />
                ) : (
                  <p className="vtt-combat-hint" style={{ padding: "1rem" }}>
                    Visitantes não rolam dados no chat.
                  </p>
                )}
              </FoundryDockPanel>
            ) : null}

            {isActualGm && !windows.isFloating("spawn") ? (
              <FoundryDockPanel
                title="Invocar monstros"
                open={win("spawn").open}
                minimized={win("spawn").minimized}
                className="foundry-dock-panel--spawn"
                onClose={() => windows.close("spawn")}
                onMinimize={() =>
                  win("spawn").minimized ? windows.restore("spawn") : windows.minimize("spawn")
                }
              >
                <div className="mesa-panel-scroll mesa-panel-scroll--rail">
                  <MonsterSpawnPanel
                    roomId={roomId}
                    scene={snapshot?.scene ?? scene}
                    spawnAxial={spawnAxial}
                    onSpawned={(snap) => applySnapshot(snap)}
                    onOpenMonsterSheet={openMonsterSheet}
                  />
                </div>
              </FoundryDockPanel>
            ) : null}
          </MesaFoundrySidebar>

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
            <div className="foundry-mesa__stage-header">
              {isActualGm ? (
                <GmMesaModeToggle
                  roomId={roomId}
                  snapshot={snapshot}
                  combatActive={roomSettings.combatActive}
                  onApplyUpdate={applyActionSnapshot}
                />
              ) : (
                <MesaModeIndicator combatActive={roomSettings.combatActive} />
              )}
              {isActualGm ? (
                <GmPlayerViewToggle
                  playAsPlayer={playAsPlayer}
                  onToggle={togglePlayAsPlayer}
                />
              ) : null}
              {isActualGm ? (
                <MesaEditRequestsBell adventureId={adventureId} roomId={roomId} />
              ) : null}
              {session ? <MesaPlayerEditRequestsBell adventureId={adventureId} /> : null}
              {session ? <MesaPlayerInventoryRequestsBell adventureId={adventureId} /> : null}
              <DemoGuidedTour
                roomId={roomId}
                session={session}
                isRoomGm={isActualGm}
              />
              <MesaGuidedTour
                roomId={roomId}
                session={session}
                isRoomGm={isActualGm}
                watchOnly={watchOnly}
              />
              <MesaOnlineMenu
                online={presenceOnline}
                loading={presenceLoading}
                selfUserId={session?.id}
              />
            </div>
            <Battlefield
              scene={scene}
              canEdit={canEdit}
              canUseWhiteboard={canEdit}
              canControlCombat={effectiveCanControlCombat}
              canManageBattlefield={isActualGm}
              canRepositionTokens={isActualGm}
              isRoomGm={effectiveIsGm}
              simulatePlayerView={playAsPlayer}
              canBypassTurn={canBypassTurn}
              canEndTurn={canEndTurn}
              roomOwnerId={roomOwnerId}
              memberIds={memberIds}
              canControlToken={canControlToken}
              canViewTokenPa={canViewTokenPaCb}
              roomId={roomId}
              adventureId={adventureId}
              inviteCode={inviteCode}
              snapshot={snapshot}
              session={session}
              roomActors={snapshot?.actors ?? {}}
              ownerDisplayNames={ownerDisplayNames}
              onRefresh={refresh}
              onApplySnapshot={applyActionSnapshot}
              onOpenSheet={openSheet}
              onOpenMonsterSheet={openMonsterSheet}
              onCreateCharacter={canCreateCharacter ? openCharacterWizard : undefined}
              onHoverAxialChange={setSpawnAxial}
              onOpenDungeonPanel={openDungeonPanel}
              showSpawnInSidebar={false}
              foundryLayout
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
              onCombatChatReveal={onCombatChatReveal}
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
              {windows.isFloating("chat") ? (
                <FoundryWindow
                  title="Chat"
                  layout={win("chat")}
                  className="foundry-window--chat"
                  onLayoutChange={(patch) => windows.patch("chat", patch)}
                  onFocus={() => windows.focus("chat")}
                  onMinimize={() =>
                    win("chat").minimized ? windows.restore("chat") : windows.minimize("chat")
                  }
                  onClose={() => windows.close("chat")}
                >
                  <RoomChat
                    roomId={roomId}
                    messages={chat}
                    tokens={scene.tokens}
                    combatReveal={combatChatReveal}
                    onUpdate={refresh}
                    readOnly={!canChat}
                  />
                </FoundryWindow>
              ) : null}

              {windows.isFloating("ficha") ? (
                <FoundryWindow
                  title="Personagens jogáveis"
                  layout={win("ficha")}
                  className="foundry-window--ficha"
                  minHeight={280}
                  onLayoutChange={(patch) => windows.patch("ficha", patch)}
                  onFocus={() => windows.focus("ficha")}
                  onMinimize={() =>
                    win("ficha").minimized ? windows.restore("ficha") : windows.minimize("ficha")
                  }
                  onClose={() => windows.close("ficha")}
                >
                  <div className="mesa-panel-scroll mesa-panel-scroll--rail">
                    <PlayableCharactersPanel
                      roomId={roomId}
                      adventureId={adventureId}
                      actors={snapshot?.actors ?? {}}
                      session={session}
                      selectedActorId={sheetPopupActorId}
                      canCreateCharacter={canCreateCharacter}
                      isRoomGm={effectiveIsGm}
                      roomOwnerId={roomOwnerId}
                      memberIds={memberIds}
                      tokens={snapshot?.scene.tokens ?? scene.tokens}
                      spawnAxial={spawnAxial}
                      onOpenSheet={openSheet}
                      onCharactersChanged={refresh}
                      onCreateCharacter={canCreateCharacter ? openCharacterWizard : undefined}
                      onPlaced={applySnapshot}
                    />
                  </div>
                </FoundryWindow>
              ) : null}

              {windows.isFloating("dice") ? (
                <FoundryWindow
                  title="Rolador de dados"
                  layout={win("dice")}
                  className="foundry-window--dice"
                  onLayoutChange={(patch) => windows.patch("dice", patch)}
                  onFocus={() => windows.focus("dice")}
                  onMinimize={() =>
                    win("dice").minimized ? windows.restore("dice") : windows.minimize("dice")
                  }
                  onClose={() => windows.close("dice")}
                >
                  {canChat ? (
                    <DiceRoller roomId={roomId} onUpdate={refresh} />
                  ) : (
                    <p className="vtt-combat-hint" style={{ padding: "1rem" }}>
                      Visitantes não rolam dados no chat.
                    </p>
                  )}
                </FoundryWindow>
              ) : null}

              {showInviteUi && windows.isFloating("invite") ? (
                <FoundryWindow
                  title="Compartilhar mesa"
                  layout={win("invite")}
                  className="foundry-window--invite"
                  minWidth={260}
                  minHeight={260}
                  onLayoutChange={(patch) => windows.patch("invite", patch)}
                  onFocus={() => windows.focus("invite")}
                  onMinimize={() =>
                    win("invite").minimized ? windows.restore("invite") : windows.minimize("invite")
                  }
                  onClose={() => windows.close("invite")}
                >
                  <div className="mesa-panel-scroll mesa-panel-scroll--invite">
                    <RoomInvitePanel
                      adventureId={adventureId}
                      roomId={shareRoomId}
                      inviteCode={roomInviteCode!}
                      roomName={roomName ?? snapshot?.scene.name ?? "Mesa"}
                      showConfigure={isRoomOwner}
                    />
                  </div>
                </FoundryWindow>
              ) : null}

              {isActualGm && windows.isFloating("spawn") ? (
                <FoundryWindow
                  title="Invocar monstros"
                  layout={win("spawn")}
                  className="foundry-window--spawn"
                  minHeight={200}
                  onLayoutChange={(patch) => windows.patch("spawn", patch)}
                  onFocus={() => windows.focus("spawn")}
                  onMinimize={() =>
                    win("spawn").minimized ? windows.restore("spawn") : windows.minimize("spawn")
                  }
                  onClose={() => windows.close("spawn")}
                >
                  <div className="mesa-panel-scroll mesa-panel-scroll--rail">
                    <MonsterSpawnPanel
                      roomId={roomId}
                      scene={snapshot?.scene ?? scene}
                      spawnAxial={spawnAxial}
                      onSpawned={(snap) => applySnapshot(snap)}
                      onOpenMonsterSheet={openMonsterSheet}
                    />
                  </div>
                </FoundryWindow>
              ) : null}

              {monsterSheetEntryId ? (
                <MonsterSheetPopup
                  entryId={monsterSheetEntryId}
                  onEntryChange={setMonsterSheetEntryId}
                  layout={win("monsterSheet")}
                  onLayoutChange={(patch) => windows.patch("monsterSheet", patch)}
                  onFocus={() => windows.focus("monsterSheet")}
                  onMinimize={() =>
                    win("monsterSheet").minimized
                      ? windows.restore("monsterSheet")
                      : windows.minimize("monsterSheet")
                  }
                  onClose={closeMonsterSheet}
                />
              ) : null}

              {sheetPopupActorId && snapshot ? (
                <CharacterSheetPopup
                  actorId={sheetPopupActorId}
                  roomId={roomId}
                  adventureId={adventureId}
                  roomOwnerId={roomOwnerId}
                  memberIds={memberIds}
                  actors={snapshot.actors}
                  session={session}
                  compendium={compendium}
                  tokens={snapshot.scene.tokens}
                  spawnAxial={spawnAxial}
                  isRoomGm={effectiveIsGm}
                  layout={win("character")}
                  onLayoutChange={(patch) => windows.patch("character", patch)}
                  onFocus={() => windows.focus("character")}
                  onMinimize={() =>
                    win("character").minimized
                      ? windows.restore("character")
                      : windows.minimize("character")
                  }
                  onClose={closeSheet}
                  onRoomPortraitPatch={handleRoomPortraitPatch}
                  onPlaced={applySnapshot}
                />
              ) : null}

              {characterWizardOpen && canCreateCharacter ? (
                <MesaCharacterWizardPopup
                  adventureId={adventureId}
                  adventureName={adventureName ?? roomName ?? "Aventura"}
                  roomId={roomId}
                  slotsLeft={characterSlotsLeft}
                  layout={win("createCharacter")}
                  onLayoutChange={(patch) => windows.patch("createCharacter", patch)}
                  onFocus={() => windows.focus("createCharacter")}
                  onMinimize={() =>
                    win("createCharacter").minimized
                      ? windows.restore("createCharacter")
                      : windows.minimize("createCharacter")
                  }
                  onClose={closeCharacterWizard}
                  onCreated={(result) => void handleCharacterCreated(result)}
                />
              ) : null}
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

function MesaWorkspaceCombatFlow({
  snapshot,
  roomId,
  onSnapshot,
}: {
  snapshot: import("@/lib/room/types").RoomSnapshot | null;
  roomId: string;
  onSnapshot: (snap: import("@/lib/room/types").RoomSnapshot) => void;
}) {
  useCombatTurnFlow({ snapshot, roomId, onSnapshot });
  return null;
}
