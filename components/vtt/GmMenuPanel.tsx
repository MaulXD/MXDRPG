"use client";

import type { BattleScene } from "@/lib/vtt/types";
import type { Axial } from "@/lib/vtt/hex-math";
import type { RoomSnapshot } from "@/lib/room/types";
import type { SessionUser } from "@/lib/auth/types";
import { MapScenePanel } from "@/components/vtt/MapScenePanel";
import { RoomSettingsPanel } from "@/components/vtt/RoomSettingsPanel";
import { PlayerSpawnPanel } from "@/components/vtt/PlayerSpawnPanel";

type Props = {
  roomId: string;
  scene: BattleScene;
  snapshot: RoomSnapshot;
  inviteCode?: string | null;
  session: SessionUser | null;
  roomActors: RoomSnapshot["actors"];
  spawnAxial: Axial | null;
  canEdit: boolean;
  adventureId?: string;
  onSceneUpdated: (snap: RoomSnapshot) => void;
};

export function GmMenuPanel({
  roomId,
  scene,
  snapshot,
  inviteCode = null,
  session,
  roomActors,
  spawnAxial,
  canEdit,
  adventureId,
  onSceneUpdated,
}: Props) {
  return (
    <aside className="vtt-sidebar vtt-sidebar--gm">
      <p className="vtt-eyebrow">Menu do mestre</p>
      <p className="vtt-sync-live">
        <span className="vtt-sync-dot" aria-hidden />
        Sync · rev {snapshot.revision}
      </p>
      <h2 className="vtt-title">{scene.name}</h2>
      <p className="vtt-hint">
        Arraste tokens no mapa. <strong>Delete</strong> remove o token selecionado. Ctrl+clique
        revela hex com névoa. Alt+clique: ping. Invocar monstros no painel ☠.
      </p>

      <RoomSettingsPanel
        roomId={roomId}
        roomName={scene.name}
        inviteCode={inviteCode ?? "—"}
        settings={snapshot.settings}
        onUpdated={onSceneUpdated}
      />

      <MapScenePanel roomId={roomId} scene={scene} onUpdated={onSceneUpdated} />

      {canEdit && Object.keys(roomActors).length > 0 ? (
        <PlayerSpawnPanel
          roomId={roomId}
          actors={roomActors}
          session={session}
          tokens={scene.tokens}
          spawnAxial={spawnAxial}
          onPlaced={onSceneUpdated}
          adventureId={adventureId ?? roomId}
          showCreateLink={roomId !== "demo" && canEdit}
        />
      ) : null}
    </aside>
  );
}
