"use client";

import type { BattleScene } from "@/lib/vtt/types";
import type { Axial } from "@/lib/vtt/hex-math";
import type { RoomSnapshot } from "@/lib/room/types";
import type { SessionUser } from "@/lib/auth/types";
import { GmActorProgressPanel } from "@/components/vtt/GmActorProgressPanel";
import { GmCreationsPanel } from "@/components/vtt/GmCreationsPanel";
import { MapScenePanel } from "@/components/vtt/MapScenePanel";
import { RoomSettingsPanel } from "@/components/vtt/RoomSettingsPanel";

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
        revela hex com névoa. Alt+clique: ping. Personagens no painel 👥 · monstros em ☠.
      </p>

      <RoomSettingsPanel
        roomId={roomId}
        roomName={scene.name}
        inviteCode={inviteCode ?? "—"}
        settings={snapshot.settings}
        onUpdated={onSceneUpdated}
      />

      <GmActorProgressPanel
        roomId={roomId}
        roomActors={roomActors}
        onUpdated={onSceneUpdated}
      />

      <GmCreationsPanel
        roomId={roomId}
        creations={snapshot.gmCreations ?? snapshot.settings.gmCreations ?? {}}
        roomActors={roomActors}
        spawnAxial={spawnAxial}
        onUpdated={onSceneUpdated}
      />

      <MapScenePanel roomId={roomId} scene={scene} onUpdated={onSceneUpdated} />

    </aside>
  );
}
