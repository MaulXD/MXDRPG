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
import { useMesaPanelLayout } from "@/hooks/vtt/useMesaPanelLayout";
import { useRoomSync } from "@/hooks/useRoomSync";
import { MesaDockPanel } from "@/components/vtt/MesaDockPanel";
import { HexBattlefield } from "@/components/vtt/HexBattlefield";
import { MesaSheetPanel } from "@/components/vtt/MesaSheetPanel";
import { MesaSideRail, type MesaRailTab } from "@/components/vtt/MesaSideRail";
import { RoomChat } from "@/components/vtt/RoomChat";
import { DiceRoller } from "@/components/vtt/DiceRoller";
import { MonsterSpawnPanel } from "@/components/vtt/MonsterSpawnPanel";
import { PlayerSpawnPanel } from "@/components/vtt/PlayerSpawnPanel";

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
  packs,
  defaultActorId = "pc-aventureiro",
}: Props) {
  const [railTab, setRailTab] = useState<MesaRailTab>("chat");
  const [sheetActorId, setSheetActorId] = useState(defaultActorId);
  const [spawnAxial, setSpawnAxial] = useState<Axial | null>(null);
  const { snapshot, syncError, refresh, applySnapshot } = useRoomSync(roomId, { inviteCode });
  const mesaPanels = useMesaPanelLayout(roomId);

  const openSheet = useCallback(
    (actorId?: string) => {
      setSheetActorId(actorId ?? defaultActorId);
      setRailTab("sheet");
    },
    [defaultActorId]
  );

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

  return (
    <div className="mesa-workspace">
      {syncError ? (
        <p className="mesa-sync-err" role="alert">
          {syncError}{" "}
          <button type="button" className="btn btn-ghost" style={{ fontSize: "0.8rem" }} onClick={() => refresh()}>
            Tentar de novo
          </button>
        </p>
      ) : null}
      <div className="mesa-workspace-body">
        <div className="mesa-stage">
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
          showSpawnInSidebar={!canControlCombat}
          leftPanel={mesaPanels.left}
          onLeftPanelChange={(patch) => mesaPanels.patch("left", patch)}
        />
        </div>

        <MesaDockPanel
          side="right"
          label="Painel"
          layout={mesaPanels.right}
          onLayoutChange={(patch) => mesaPanels.patch("right", patch)}
        >
        <MesaSideRail
        tab={railTab}
        onTabChange={setRailTab}
        showSpawn={canControlCombat}
      >
        {railTab === "chat" ? (
          <RoomChat
            roomId={roomId}
            messages={chat}
            onUpdate={refresh}
            readOnly={!canChat}
          />
        ) : null}
        {railTab === "dice" && canChat ? (
          <DiceRoller roomId={roomId} onUpdate={refresh} />
        ) : null}
        {railTab === "dice" && !canChat ? (
          <p className="vtt-combat-hint" style={{ padding: "1rem" }}>
            Visitantes não rolam dados no chat.
          </p>
        ) : null}
        {railTab === "sheet" ? (
          <>
            {canEdit && snapshot?.actors ? (
              <PlayerSpawnPanel
                roomId={roomId}
                actors={snapshot.actors}
                session={session}
                tokens={snapshot.scene.tokens}
                spawnAxial={spawnAxial}
                onPlaced={applySnapshot}
                adventureId={adventureId}
                showCreateLink={roomId !== "demo"}
              />
            ) : null}
            <MesaSheetPanel
              actorId={sheetActorId}
              roomId={roomId}
              actors={snapshot?.actors ?? {}}
              session={session}
              compendium={compendium}
            />
          </>
        ) : null}
        {railTab === "spawn" && canControlCombat ? (
          <div className="mesa-panel-scroll mesa-panel-scroll--rail">
            <MonsterSpawnPanel
              roomId={roomId}
              spawnAxial={spawnAxial}
              onSpawned={(snap) => applySnapshot(snap)}
            />
          </div>
        ) : null}
        </MesaSideRail>
        </MesaDockPanel>
      </div>
    </div>
  );
}
