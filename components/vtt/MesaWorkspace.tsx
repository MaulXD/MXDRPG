"use client";

import { useCallback, useMemo, useState } from "react";
import {
  canAdvanceCombatTurn,
  canControlToken as canControlTokenCheck,
  canViewTokenPa,
} from "@/lib/auth/combat-turn-access";
import { canBypassCombatTurn } from "@/lib/auth/room-access";
import { normalizeRoomSettings } from "@/lib/room/settings";
import type { SessionUser } from "@/lib/auth/types";
import type { CompendiumEntry, CompendiumPackId, CompendiumPackMeta } from "@/lib/compendium/types";
import type { BattleScene } from "@/lib/vtt/types";
import type { Axial } from "@/lib/vtt/hex-math";
import { useCombatTurnFlow } from "@/hooks/vtt/useCombatTurnFlow";
import { useFoundryWindows } from "@/hooks/vtt/useFoundryWindows";
import { useRoomSync } from "@/hooks/useRoomSync";
import { VttToastProvider } from "@/components/vtt/VttToast";
import { FoundryDockPanel } from "@/components/vtt/foundry/FoundryDockPanel";
import { MesaFoundrySidebar } from "@/components/vtt/foundry/MesaFoundrySidebar";
import { HexBattlefield } from "@/components/vtt/HexBattlefield";
import { CharacterSheetPopup } from "@/components/vtt/CharacterSheetPopup";
import { RoomChat } from "@/components/vtt/RoomChat";
import { DiceRoller } from "@/components/vtt/DiceRoller";
import { MonsterSpawnPanel } from "@/components/vtt/MonsterSpawnPanel";
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
  session: SessionUser | null;
  compendium: Record<CompendiumPackId, CompendiumEntry[]>;
  packs: CompendiumPackMeta[];
  defaultActorId?: string;
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
  session,
  compendium,
  packs: _packs,
  defaultActorId = "pc-aventureiro",
}: Props) {
  const [sheetPopupActorId, setSheetPopupActorId] = useState<string | null>(null);
  const [spawnAxial, setSpawnAxial] = useState<Axial | null>(null);
  const { snapshot, syncError, refresh, applySnapshot } = useRoomSync(roomId, { inviteCode });
  const windows = useFoundryWindows(roomId);

  const openSheet = useCallback(
    (actorId?: string) => {
      const id = actorId ?? defaultActorId;
      setSheetPopupActorId(id);
      windows.open("character");
    },
    [defaultActorId, windows]
  );

  const closeSheet = useCallback(() => {
    setSheetPopupActorId(null);
    windows.close("character");
  }, [windows]);

  const openDungeonPanel = useCallback(() => {
    windows.open("dungeon");
  }, [windows]);

  const chat = snapshot?.chat ?? [];

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
      canControlTokenCheck(turnRoom, session, token),
    [turnRoom, session]
  );

  const canViewTokenPaCb = useCallback(
    (token: import("@/lib/vtt/types").BattleToken) => canViewTokenPa(turnRoom, session, token),
    [turnRoom, session]
  );

  const canEndTurn = useMemo(() => {
    if (!snapshot?.combat?.order.length) return false;
    return canAdvanceCombatTurn(turnRoom, session, snapshot.combat);
  }, [snapshot?.combat, session, turnRoom]);

  const canBypassTurn = useMemo(() => {
    return canBypassCombatTurn(
      {
        ownerId: roomOwnerId,
        settings: normalizeRoomSettings(snapshot?.settings),
      },
      session
    );
  }, [roomOwnerId, snapshot?.settings, session]);

  const win = windows.get;
  const dockOpen = windows.isDockOpen();

  return (
    <VttToastProvider>
      <MesaWorkspaceCombatFlow
        roomId={roomId}
        roomOwnerId={roomOwnerId}
        memberIds={memberIds}
        snapshot={snapshot}
        session={session}
        canEndTurn={canEndTurn}
        applySnapshot={applySnapshot}
        refresh={refresh}
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
        ) : null}

        <div className="foundry-mesa">
          <MesaFoundrySidebar
            isActive={windows.isActive}
            onToggle={windows.toggle}
            showGm={canControlCombat}
            dockOpen={dockOpen}
          >
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
              <RoomChat roomId={roomId} messages={chat} onUpdate={refresh} readOnly={!canChat} />
            </FoundryDockPanel>

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

            <FoundryDockPanel
              title="Ficha do personagem"
              open={win("ficha").open}
              minimized={win("ficha").minimized}
              className="foundry-dock-panel--ficha"
              onClose={() => windows.close("ficha")}
              onMinimize={() =>
                win("ficha").minimized ? windows.restore("ficha") : windows.minimize("ficha")
              }
            >
              <div className="mesa-sheet-rail-hint">
                <p className="vtt-combat-hint">
                  Selecione um token e use <strong>Abrir ficha</strong>, ou o botão abaixo. Para
                  colocar PCs no mapa, use o painel <strong>Tokens</strong>.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: "100%", marginTop: "0.5rem" }}
                  onClick={() => openSheet(defaultActorId)}
                >
                  Abrir minha ficha
                </button>
              </div>
            </FoundryDockPanel>

            {canControlCombat ? (
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
                    spawnAxial={spawnAxial}
                    onSpawned={(snap) => applySnapshot(snap)}
                  />
                </div>
              </FoundryDockPanel>
            ) : null}
          </MesaFoundrySidebar>

          <div className="foundry-mesa__stage">
            <HexBattlefield
              scene={scene}
              canEdit={canEdit}
              canControlCombat={canControlCombat}
              canBypassTurn={canBypassTurn}
              canEndTurn={canEndTurn}
              roomOwnerId={roomOwnerId}
              canControlToken={canControlToken}
              canViewTokenPa={canViewTokenPaCb}
              roomId={roomId}
              adventureId={adventureId}
              inviteCode={inviteCode}
              snapshot={snapshot}
              session={session}
              roomActors={snapshot?.actors ?? {}}
              onRefresh={refresh}
              onApplySnapshot={applySnapshot}
              onOpenSheet={openSheet}
              onHoverAxialChange={setSpawnAxial}
              onOpenDungeonPanel={openDungeonPanel}
              showSpawnInSidebar={false}
              foundryLayout
              actorsWindowLayout={win("actors")}
              onActorsWindowLayoutChange={(patch) => windows.patch("actors", patch)}
              onActorsWindowClose={() => windows.close("actors")}
              onActorsWindowMinimize={() =>
                win("actors").minimized ? windows.restore("actors") : windows.minimize("actors")
              }
              onActorsWindowFocus={() => windows.focus("actors")}
              gmWindowLayout={win("gm")}
              onGmWindowLayoutChange={(patch) => windows.patch("gm", patch)}
              onGmWindowClose={() => windows.close("gm")}
              onGmWindowMinimize={() =>
                win("gm").minimized ? windows.restore("gm") : windows.minimize("gm")
              }
              onGmWindowFocus={() => windows.focus("gm")}
              dungeonWindowLayout={win("dungeon")}
              onDungeonWindowClose={() => windows.close("dungeon")}
              onDungeonWindowMinimize={() =>
                win("dungeon").minimized ? windows.restore("dungeon") : windows.minimize("dungeon")
              }
              whiteboardWindowLayout={win("whiteboard")}
              onWhiteboardWindowClose={() => windows.close("whiteboard")}
              onWhiteboardWindowMinimize={() =>
                win("whiteboard").minimized
                  ? windows.restore("whiteboard")
                  : windows.minimize("whiteboard")
              }
              initiativeWindowLayout={win("initiative")}
              onInitiativeWindowLayoutChange={(patch) => windows.patch("initiative", patch)}
              onInitiativeWindowClose={() => windows.close("initiative")}
              onInitiativeWindowMinimize={() =>
                win("initiative").minimized
                  ? windows.restore("initiative")
                  : windows.minimize("initiative")
              }
              onInitiativeWindowFocus={() => windows.focus("initiative")}
            />
          </div>

          <div id="foundry-mesa-hud" className="foundry-mesa__hud">
            <div id="foundry-mesa-windows" className="foundry-mesa__windows">
              {sheetPopupActorId && snapshot ? (
                <CharacterSheetPopup
                  actorId={sheetPopupActorId}
                  roomId={roomId}
                  adventureId={adventureId}
                  actors={snapshot.actors}
                  session={session}
                  compendium={compendium}
                  layout={win("character")}
                  onLayoutChange={(patch) => windows.patch("character", patch)}
                  onFocus={() => windows.focus("character")}
                  onMinimize={() =>
                    win("character").minimized
                      ? windows.restore("character")
                      : windows.minimize("character")
                  }
                  onClose={closeSheet}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </VttToastProvider>
  );
}

function MesaWorkspaceCombatFlow({
  roomId,
  roomOwnerId,
  memberIds,
  snapshot,
  session,
  canEndTurn,
  applySnapshot,
  refresh,
}: {
  roomId: string;
  roomOwnerId: string;
  memberIds: string[];
  snapshot: import("@/lib/room/types").RoomSnapshot | null;
  session: SessionUser | null;
  canEndTurn: boolean;
  applySnapshot: (snap: import("@/lib/room/types").RoomSnapshot) => void;
  refresh: () => void;
}) {
  useCombatTurnFlow({
    roomId,
    roomCtx: { roomId, ownerId: roomOwnerId, memberIds },
    snapshot,
    session,
    canEndTurn,
    onSnapshot: applySnapshot,
    onRefresh: refresh,
  });
  return null;
}
