"use client";

import { useCallback, useMemo, useState } from "react";
import {
  canAdvanceCombatTurn,
  canControlToken as canControlTokenCheck,
  canViewTokenPa,
} from "@/lib/auth/combat-turn-access";
import type { SessionUser } from "@/lib/auth/types";
import type { CompendiumEntry, CompendiumPackId, CompendiumPackMeta } from "@/lib/compendium/types";
import type { BattleScene } from "@/lib/vtt/types";
import type { Axial } from "@/lib/vtt/hex-math";
import { useCombatTurnFlow } from "@/hooks/vtt/useCombatTurnFlow";
import { useFoundryWindows } from "@/hooks/vtt/useFoundryWindows";
import { useRoomSync } from "@/hooks/useRoomSync";
import { VttToastProvider } from "@/components/vtt/VttToast";
import { FoundryWindow } from "@/components/vtt/foundry/FoundryWindow";
import { MesaIconBar } from "@/components/vtt/foundry/MesaIconBar";
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

  const win = windows.get;

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
          <button type="button" className="btn btn-ghost" style={{ fontSize: "0.8rem" }} onClick={() => refresh()}>
            Tentar de novo
          </button>
        </p>
      ) : null}

      <div className="foundry-mesa">
        <div className="foundry-mesa__stage">
          <HexBattlefield
            scene={scene}
            canEdit={canEdit}
            canControlCombat={canControlCombat}
            canEndTurn={canEndTurn}
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
            initiativeWindowLayout={win("initiative")}
            onInitiativeWindowLayoutChange={(patch) => windows.patch("initiative", patch)}
            onInitiativeWindowClose={() => windows.close("initiative")}
            onInitiativeWindowMinimize={() =>
              win("initiative").minimized ? windows.restore("initiative") : windows.minimize("initiative")
            }
            onInitiativeWindowFocus={() => windows.focus("initiative")}
          />
        </div>

        <div id="foundry-mesa-hud" className="foundry-mesa__hud">
          <div id="foundry-mesa-windows" className="foundry-mesa__windows">
          <FoundryWindow
            title="Chat"
            layout={win("chat")}
            className="foundry-window--chat"
            onLayoutChange={(patch) => windows.patch("chat", patch)}
            onClose={() => windows.close("chat")}
            onMinimize={() =>
              win("chat").minimized ? windows.restore("chat") : windows.minimize("chat")
            }
            onFocus={() => windows.focus("chat")}
            minHeight={160}
          >
            <RoomChat
              roomId={roomId}
              messages={chat}
              onUpdate={refresh}
              readOnly={!canChat}
            />
          </FoundryWindow>

          <FoundryWindow
            title="Dados"
            layout={win("dice")}
            className="foundry-window--dice"
            onLayoutChange={(patch) => windows.patch("dice", patch)}
            onClose={() => windows.close("dice")}
            onMinimize={() =>
              win("dice").minimized ? windows.restore("dice") : windows.minimize("dice")
            }
            onFocus={() => windows.focus("dice")}
            minHeight={140}
          >
            {canChat ? (
              <DiceRoller roomId={roomId} onUpdate={refresh} />
            ) : (
              <p className="vtt-combat-hint" style={{ padding: "1rem" }}>
                Visitantes não rolam dados no chat.
              </p>
            )}
          </FoundryWindow>

          <FoundryWindow
            title="Ficha"
            layout={win("ficha")}
            className="foundry-window--ficha"
            onLayoutChange={(patch) => windows.patch("ficha", patch)}
            onClose={() => windows.close("ficha")}
            onMinimize={() =>
              win("ficha").minimized ? windows.restore("ficha") : windows.minimize("ficha")
            }
            onFocus={() => windows.focus("ficha")}
            minHeight={180}
          >
            <div className="mesa-sheet-rail-hint">
              <p className="vtt-combat-hint">
                Clique em um token com ficha e use <strong>Abrir ficha</strong>, ou abaixo.
                {canControlCombat ? (
                  <>
                    {" "}
                    Colocar personagens no mapa: painel <strong>⚙ Menu do mestre</strong>.
                  </>
                ) : null}
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
          </FoundryWindow>

          {canControlCombat ? (
            <FoundryWindow
              title="Invocar"
              layout={win("spawn")}
              className="foundry-window--spawn"
              onLayoutChange={(patch) => windows.patch("spawn", patch)}
              onClose={() => windows.close("spawn")}
              onMinimize={() =>
                win("spawn").minimized ? windows.restore("spawn") : windows.minimize("spawn")
              }
              onFocus={() => windows.focus("spawn")}
              minHeight={200}
            >
              <div className="mesa-panel-scroll mesa-panel-scroll--rail">
                <MonsterSpawnPanel
                  roomId={roomId}
                  spawnAxial={spawnAxial}
                  onSpawned={(snap) => applySnapshot(snap)}
                />
              </div>
            </FoundryWindow>
          ) : null}

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

          <MesaIconBar
            isActive={windows.isActive}
            onToggle={windows.toggle}
            showGm={canControlCombat}
          />
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
