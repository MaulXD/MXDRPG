"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RoomCoverEditor } from "@/components/vtt/RoomCoverEditor";
import type { RoomSettings } from "@/lib/room/settings";
import type { RoomSnapshot } from "@/lib/room/types";
import "@/components/vtt/vtt.css";

type Props = {
  roomId: string;
  settings: RoomSettings;
};

export function AdventureCoverManager({ roomId, settings: initialSettings }: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);

  function onUpdated(snapshot: RoomSnapshot) {
    setSettings(snapshot.settings);
    router.refresh();
  }

  return (
    <section className="glass-panel adventure-cover-manager" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
      <h2 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>Capa da mesa</h2>
      <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: "0 0 1rem", lineHeight: 1.45 }}>
        Miniatura quadrada nos cartões de <strong>Suas mesas</strong> — ajuste zoom e posição após enviar a
        imagem. Sem capa, usamos o mapa da sala ou a imagem padrão do Eldarin.
      </p>
      <RoomCoverEditor
        roomId={roomId}
        coverUrl={settings.coverUrl}
        coverFocus={settings.coverFocus}
        variant="hub"
        onUpdated={onUpdated}
      />
    </section>
  );
}
