"use client";

import type { BattleScene } from "@/lib/vtt/types";
import type { Axial } from "@/lib/vtt/hex-math";
import type { RoomSnapshot } from "@/lib/room/types";
import { GmActorProgressPanel } from "@/components/vtt/GmActorProgressPanel";
import { GmCreationsPanel } from "@/components/vtt/GmCreationsPanel";
import { RoomSettingsPanel } from "@/components/vtt/RoomSettingsPanel";

type Props = {
  roomId: string;
  scene: BattleScene;
  snapshot: RoomSnapshot;
  inviteCode?: string | null;
  roomActors: RoomSnapshot["actors"];
  spawnAxial: Axial | null;
  onSceneUpdated: (snap: RoomSnapshot) => void;
};

/** Configurações e ferramentas do mestre (sem editor de mapa). */
export function GmToolsPanel({
  roomId,
  scene,
  snapshot,
  inviteCode = null,
  roomActors,
  spawnAxial,
  onSceneUpdated,
}: Props) {
  return (
    <aside className="vtt-sidebar vtt-sidebar--gm">
      <p className="vtt-eyebrow">Ferramentas do mestre</p>
      <p className="vtt-sync-live">
        <span className="vtt-sync-dot" aria-hidden />
        Sync · rev {snapshot.revision}
      </p>
      <h2 className="vtt-title">{scene.name}</h2>
      <p className="vtt-hint">
        <strong>Delete</strong> remove token selecionado. Ctrl+clique revela névoa. Alt+clique envia
        ping no mapa.
      </p>

      <RoomSettingsPanel
        roomId={roomId}
        roomName={scene.name}
        inviteCode={inviteCode ?? "—"}
        settings={snapshot.settings}
        onUpdated={onSceneUpdated}
      />

      <GmActorProgressPanel roomId={roomId} roomActors={roomActors} onUpdated={onSceneUpdated} />

      <GmCreationsPanel
        roomId={roomId}
        creations={snapshot.gmCreations ?? snapshot.settings.gmCreations ?? {}}
        roomActors={roomActors}
        spawnAxial={spawnAxial}
        onUpdated={onSceneUpdated}
      />
    </aside>
  );
}
