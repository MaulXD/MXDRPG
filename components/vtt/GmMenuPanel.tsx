"use client";

import type { BattleScene } from "@/lib/vtt/types";
import type { Axial } from "@/lib/vtt/hex-math";
import type { RoomSnapshot } from "@/lib/room/types";
import type { SessionUser } from "@/lib/auth/types";
import { GmActorProgressPanel } from "@/components/vtt/GmActorProgressPanel";
import { GmCreationsPanel } from "@/components/vtt/GmCreationsPanel";
import {
  DungeonEditorPanel,
  type DungeonEditLayer,
  type DungeonEditorTool,
} from "@/components/vtt/DungeonEditorPanel";
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
  canEditScene?: boolean;
  adventureId?: string;
  onSceneUpdated: (snap: RoomSnapshot) => void;
  dungeonLayer?: DungeonEditLayer;
  dungeonEditorActive?: boolean;
  dungeonTool?: DungeonEditorTool;
  selectedDungeonObjectId?: string | null;
  onDungeonLayerChange?: (layer: DungeonEditLayer) => void;
  onDungeonEditorActiveChange?: (active: boolean) => void;
  onDungeonToolChange?: (tool: DungeonEditorTool) => void;
  onSelectedDungeonObjectChange?: (id: string | null) => void;
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
  canEditScene = false,
  adventureId,
  onSceneUpdated,
  dungeonLayer = "floor",
  dungeonEditorActive = false,
  dungeonTool = "wall",
  selectedDungeonObjectId = null,
  onDungeonLayerChange,
  onDungeonEditorActiveChange,
  onDungeonToolChange,
  onSelectedDungeonObjectChange,
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
        Arraste tokens no mapa. <strong>Delete</strong> remove o token. <strong>🏰</strong> abre o
        editor de masmorras (piso, paredes, objetos). Ctrl+clique revela névoa. Alt+clique: ping.
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

      {canEditScene ? (
        <DungeonEditorPanel
          roomId={roomId}
          scene={scene}
          layer={dungeonLayer}
          active={dungeonEditorActive}
          tool={dungeonTool}
          selectedObjectId={selectedDungeonObjectId}
          onLayerChange={onDungeonLayerChange ?? (() => {})}
          onActiveChange={onDungeonEditorActiveChange ?? (() => {})}
          onToolChange={onDungeonToolChange ?? (() => {})}
          onSelectedObjectChange={onSelectedDungeonObjectChange ?? (() => {})}
          onUpdated={onSceneUpdated}
        />
      ) : (
        <p className="vtt-combat-hint">
          O editor de masmorras (3 camadas) está disponível só para o mestre da mesa.
        </p>
      )}

    </aside>
  );
}
