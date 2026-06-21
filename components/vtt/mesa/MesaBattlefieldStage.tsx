"use client";

import { memo, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import type { SessionUser } from "@/lib/auth/types";
import type { BattleScene } from "@/lib/vtt/types";
import type { Axial } from "@/lib/vtt/grid-math";
import type { RoomApiPayload } from "@/lib/room/room-delta";
import type { RoomSnapshot } from "@/lib/room/types";
import { useMesaMapSnapshot } from "@/hooks/vtt/useMesaRoomSlice";
import { useMesaSyncActions } from "@/components/vtt/MesaSyncProvider";
import type { FoundryWindowLayout, MesaWindowId } from "@/hooks/vtt/useFoundryWindows";

const Battlefield = dynamic(
  () => import("@/components/vtt/Battlefield").then((m) => m.Battlefield),
  {
    ssr: false,
    loading: () => (
      <div className="foundry-mesa__battlefield-loading" aria-busy aria-label="Carregando mapa">
        <span className="foundry-mesa__battlefield-loading-pulse" />
      </div>
    ),
  }
);

export type MesaBattlefieldStageProps = {
  roomId: string;
  adventureId: string;
  roomOwnerId: string;
  memberIds: string[];
  fallbackScene: BattleScene;
  canEdit: boolean;
  effectiveCanControlCombat: boolean;
  isActualGm: boolean;
  effectiveIsGm: boolean;
  playAsPlayer: boolean;
  canBypassTurn: boolean;
  canEndTurn: boolean;
  inviteCode?: string | null;
  session: SessionUser | null;
  ownerDisplayNames?: Map<string, string>;
  canControlToken: (token: import("@/lib/vtt/types").BattleToken) => boolean;
  canViewTokenPa: (token: import("@/lib/vtt/types").BattleToken) => boolean;
  onOpenSheet: (actorId?: string) => void;
  onOpenMonsterSheet: (entryId: string) => void;
  onCreateCharacter?: () => void;
  onHoverAxialChange: (axial: Axial | null) => void;
  onOpenDungeonPanel: () => void;
  onCombatChatReveal: (messageIds: string[], phase: "roll" | "damage" | "done") => void;
  gmWindowLayout: FoundryWindowLayout;
  onGmWindowLayoutChange: (patch: Partial<FoundryWindowLayout>) => void;
  onGmWindowClose: () => void;
  onGmWindowMinimize: () => void;
  onGmWindowFocus: () => void;
  dungeonWindowLayout: FoundryWindowLayout;
  onDungeonWindowLayoutChange: (patch: Partial<FoundryWindowLayout>) => void;
  onDungeonWindowClose: () => void;
  onDungeonWindowMinimize: () => void;
  onDungeonWindowFocus: () => void;
  initiativeWindowLayout: FoundryWindowLayout;
  onInitiativeWindowLayoutChange: (patch: Partial<FoundryWindowLayout>) => void;
  onInitiativeWindowClose: () => void;
  onInitiativeWindowMinimize: () => void;
  onInitiativeWindowFocus: () => void;
  statusWindowLayout: FoundryWindowLayout;
  onStatusWindowLayoutChange: (patch: Partial<FoundryWindowLayout>) => void;
  onStatusWindowClose: () => void;
  onStatusWindowMinimize: () => void;
  onStatusWindowFocus: () => void;
  onStatusDockOpen: () => void;
  isWindowFloating: (id: MesaWindowId) => boolean;
};

/** Mapa + combate — re-render só quando slice map muda (não em chat puro). */
function MesaBattlefieldStageInner(props: MesaBattlefieldStageProps) {
  const mapSnapshot = useMesaMapSnapshot(props.roomId);
  const { refresh, applyRoomResponse } = useMesaSyncActions();

  const applyActionSnapshot = useCallback(
    (payload: RoomApiPayload, opts?: { force?: boolean; immediate?: boolean }) =>
      applyRoomResponse(payload, {
        force: opts?.force ?? true,
        immediate: opts?.immediate ?? false,
      }),
    [applyRoomResponse]
  );

  return (
    <Battlefield
      scene={props.fallbackScene}
      canEdit={props.canEdit}
      canUseWhiteboard={props.canEdit}
      canControlCombat={props.effectiveCanControlCombat}
      canManageBattlefield={props.isActualGm}
      canRepositionTokens={props.isActualGm}
      isRoomGm={props.effectiveIsGm}
      simulatePlayerView={props.playAsPlayer}
      canBypassTurn={props.canBypassTurn}
      canEndTurn={props.canEndTurn}
      roomOwnerId={props.roomOwnerId}
      memberIds={props.memberIds}
      canControlToken={props.canControlToken}
      canViewTokenPa={props.canViewTokenPa}
      roomId={props.roomId}
      adventureId={props.adventureId}
      inviteCode={props.inviteCode}
      snapshot={mapSnapshot}
      session={props.session}
      roomActors={mapSnapshot?.actors ?? {}}
      ownerDisplayNames={props.ownerDisplayNames}
      onRefresh={refresh}
      onApplySnapshot={applyActionSnapshot}
      onOpenSheet={props.onOpenSheet}
      onOpenMonsterSheet={props.onOpenMonsterSheet}
      onCreateCharacter={props.onCreateCharacter}
      onHoverAxialChange={props.onHoverAxialChange}
      onOpenDungeonPanel={props.onOpenDungeonPanel}
      showSpawnInSidebar={false}
      foundryLayout
      gmWindowLayout={props.gmWindowLayout}
      onGmWindowLayoutChange={props.onGmWindowLayoutChange}
      onGmWindowClose={props.onGmWindowClose}
      onGmWindowMinimize={props.onGmWindowMinimize}
      onGmWindowFocus={props.onGmWindowFocus}
      dungeonWindowLayout={props.dungeonWindowLayout}
      onDungeonWindowLayoutChange={props.onDungeonWindowLayoutChange}
      onDungeonWindowClose={props.onDungeonWindowClose}
      onDungeonWindowMinimize={props.onDungeonWindowMinimize}
      onDungeonWindowFocus={props.onDungeonWindowFocus}
      onCombatChatReveal={props.onCombatChatReveal}
      initiativeWindowLayout={props.initiativeWindowLayout}
      onInitiativeWindowLayoutChange={props.onInitiativeWindowLayoutChange}
      onInitiativeWindowClose={props.onInitiativeWindowClose}
      onInitiativeWindowMinimize={props.onInitiativeWindowMinimize}
      onInitiativeWindowFocus={props.onInitiativeWindowFocus}
      statusWindowLayout={props.statusWindowLayout}
      onStatusWindowLayoutChange={props.onStatusWindowLayoutChange}
      onStatusWindowClose={props.onStatusWindowClose}
      onStatusWindowMinimize={props.onStatusWindowMinimize}
      onStatusWindowFocus={props.onStatusWindowFocus}
      onStatusDockOpen={props.onStatusDockOpen}
      isWindowFloating={props.isWindowFloating}
    />
  );
}

export const MesaBattlefieldStage = memo(MesaBattlefieldStageInner);
