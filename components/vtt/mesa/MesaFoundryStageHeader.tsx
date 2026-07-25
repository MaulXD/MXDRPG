"use client";

import type { SessionUser } from "@/lib/auth/types";
import type { RoomSnapshot } from "@/lib/room/types";
import type { RoomApiPayload } from "@/lib/room/room-delta";
import type { RoomSyncStatus } from "@/hooks/useRoomSync";
import type { RpgSystemId } from "@/lib/rpg/systems";
import { MesaSyncIndicator } from "@/components/vtt/MesaSyncIndicator";
import { GmMesaModeToggle, MesaModeIndicator } from "@/components/vtt/GmMesaModeToggle";
import { GmPlayerViewToggle } from "@/components/vtt/GmPlayerViewToggle";
import { MesaEditRequestsBell } from "@/components/vtt/MesaEditRequestsBell";
import { MesaPlayerEditRequestsBell } from "@/components/vtt/MesaPlayerEditRequestsBell";
import { MesaPlayerInventoryRequestsBell } from "@/components/vtt/MesaPlayerInventoryRequestsBell";
import { MesaOnlineMenu } from "@/components/vtt/MesaOnlineMenu";
import type { RoomPresenceMember } from "@/hooks/useRoomPresence";

type Props = {
  roomId: string;
  adventureId: string;
  rpgSystemId?: RpgSystemId;
  mapSnapshot: RoomSnapshot | null;
  combatActive: boolean;
  syncStatus: RoomSyncStatus;
  syncError: string | null;
  isActualGm: boolean;
  playAsPlayer: boolean;
  session: SessionUser | null;
  presenceOnline: RoomPresenceMember[];
  presenceLoading: boolean;
  onRetrySync: () => void;
  onApplyUpdate: (payload: RoomApiPayload, opts?: { force?: boolean; immediate?: boolean }) => void;
  onTogglePlayAsPlayer: () => void;
};

export function MesaFoundryStageHeader({
  roomId,
  adventureId,
  rpgSystemId = "eldarin",
  mapSnapshot,
  combatActive,
  syncStatus,
  syncError,
  isActualGm,
  playAsPlayer,
  session,
  presenceOnline,
  presenceLoading,
  onRetrySync,
  onApplyUpdate,
  onTogglePlayAsPlayer,
}: Props) {
  return (
    <div className="foundry-mesa__stage-header">
      <div className="foundry-mesa__stage-tools">
        <MesaSyncIndicator syncStatus={syncStatus} syncError={syncError} onRetry={onRetrySync} />
        {isActualGm ? (
          <GmMesaModeToggle
            roomId={roomId}
            snapshot={mapSnapshot}
            combatActive={combatActive}
            rpgSystemId={rpgSystemId}
            onApplyUpdate={onApplyUpdate}
          />
        ) : (
          <MesaModeIndicator combatActive={combatActive} rpgSystemId={rpgSystemId} />
        )}
        {isActualGm ? (
          <GmPlayerViewToggle playAsPlayer={playAsPlayer} onToggle={onTogglePlayAsPlayer} />
        ) : null}
        {isActualGm ? <MesaEditRequestsBell adventureId={adventureId} roomId={roomId} /> : null}
        {session ? <MesaPlayerEditRequestsBell adventureId={adventureId} /> : null}
        {session ? <MesaPlayerInventoryRequestsBell adventureId={adventureId} /> : null}
        <MesaOnlineMenu
          online={presenceOnline}
          loading={presenceLoading}
          selfUserId={session?.id}
        />
      </div>
    </div>
  );
}
