"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapScenePanel } from "@/components/vtt/MapScenePanel";
import { RoomSettingsPanel } from "@/components/vtt/RoomSettingsPanel";
import type { RoomSettings } from "@/lib/room/settings";
import type { BattleScene } from "@/lib/vtt/types";
import type { RoomSnapshot } from "@/lib/room/types";

type Props = {
  roomId: string;
  roomName: string;
  inviteCode: string;
  settings: RoomSettings;
  scene: BattleScene;
};

export function MesaSetupClient({
  roomId,
  roomName,
  inviteCode,
  settings: initialSettings,
  scene: initialScene,
}: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [scene, setScene] = useState(initialScene);
  const [name, setName] = useState(roomName);

  function onSnapshot(snap: RoomSnapshot) {
    setSettings(snap.settings);
    setScene(snap.scene);
    router.refresh();
  }

  return (
    <>
      <RoomSettingsPanel
        roomId={roomId}
        roomName={name}
        settings={settings}
        coverVariant="hub"
        onUpdated={(snap) => {
          setName(snap.scene.name);
          onSnapshot(snap);
        }}
      />
      <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", margin: "0.5rem 0" }} />
      <MapScenePanel roomId={roomId} scene={scene} onUpdated={onSnapshot} />
    </>
  );
}
