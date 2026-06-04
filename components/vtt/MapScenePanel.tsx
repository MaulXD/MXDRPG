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
  const [scale, setScale] = useState(String(scene.mapImageScale ?? 1));
  const [offX, setOffX] = useState(String(scene.mapImageOffsetX ?? 0));
  const [offY, setOffY] = useState(String(scene.mapImageOffsetY ?? 0));
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
        mapImageScale: Number(scale) || 1,
        mapImageOffsetX: Number(offX) || 0,
        mapImageOffsetY: Number(offY) || 0,
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
      <div className="vtt-map-panel-row">
        <label className="vtt-field vtt-field--compact">
          <span>Escala</span>
          <input type="number" min={0.25} max={4} step={0.05} value={scale} onChange={(e) => setScale(e.target.value)} />
        </label>
        <label className="vtt-field vtt-field--compact">
          <span>Offset X</span>
          <input type="number" step={10} value={offX} onChange={(e) => setOffX(e.target.value)} />
        </label>
        <label className="vtt-field vtt-field--compact">
          <span>Offset Y</span>
          <input type="number" step={10} value={offY} onChange={(e) => setOffY(e.target.value)} />
        </label>
      </div>
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
