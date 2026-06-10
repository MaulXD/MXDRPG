"use client";

import { useState } from "react";
import type { BattleScene } from "@/lib/vtt/types";
import type { RoomSnapshot } from "@/lib/room/types";
import { patchRoomScene } from "@/hooks/useRoomSync";

type Props = {
  roomId: string;
  scene: BattleScene;
  onUpdated: (snapshot: RoomSnapshot) => void;
};

export function MapScenePanel({ roomId, scene, onUpdated }: Props) {
  const [url, setUrl] = useState(scene.mapImageUrl ?? "");
  const [fog, setFog] = useState(Boolean(scene.fogEnabled));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function applyMap() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const snapshot = await patchRoomScene(roomId, {
        mapImageUrl: url.trim() || null,
        fogEnabled: fog,
      });
      onUpdated(snapshot);
      setMsg("Mapa atualizado.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  async function clearFog() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const snapshot = await patchRoomScene(roomId, { revealedHexes: [] });
      onUpdated(snapshot);
      setMsg("Fog resetada (nenhum hex revelado).");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="vtt-map-panel">
      <p className="vtt-eyebrow">Mapa &amp; fog</p>
      <label className="vtt-field">
        <span>URL da imagem de fundo</span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…/mapa.jpg"
        />
      </label>
      <p className="vtt-combat-hint">
        Posição e escala do fundo são ajustadas na mesa: aba <strong>1 · Piso</strong> do editor de mapa e
        arraste/redimensione direto no mapa.
      </p>
      <label className="vtt-check">
        <input type="checkbox" checked={fog} onChange={(e) => setFog(e.target.checked)} />
        Fog of war ativa
      </label>
      <p className="vtt-combat-hint">
        Alt+clique no mapa: ping (todos veem). Com fog: Ctrl+clique revela hex. Movimento dos tokens
        revela o hex onde param.
      </p>
      <div className="vtt-map-panel-actions">
        <button type="button" className="vtt-btn" disabled={busy} onClick={() => void applyMap()}>
          Aplicar mapa
        </button>
        {fog ? (
          <button type="button" className="vtt-btn vtt-btn--ghost" disabled={busy} onClick={() => void clearFog()}>
            Limpar revelados
          </button>
        ) : null}
      </div>
      {msg ? <p className="vtt-combat-hint">{msg}</p> : null}
    </div>
  );
}
