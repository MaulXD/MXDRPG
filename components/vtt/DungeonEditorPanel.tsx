"use client";

import { useEffect, useRef, useState } from "react";
import type { BattleScene, DungeonObjectKind } from "@/lib/vtt/types";
import type { RoomSnapshot } from "@/lib/room/types";
import { patchRoomScene } from "@/hooks/useRoomSync";
import { buildMapImageFromFile } from "@/lib/media/image-upload-client";
import {
  addDungeonObject,
  dungeonObjectsOf,
  moveDungeonObject,
  removeDungeonObjectAt,
} from "@/lib/vtt/dungeon-layer";

export type DungeonEditorTool = "wall" | "object" | "erase" | "move";

/** Camada ativa no editor: piso (imagem), objetos (paredes), tokens (só leitura). */
export type DungeonEditLayer = "floor" | "objects" | "tokens";

type Props = {
  roomId: string;
  scene: BattleScene;
  layer: DungeonEditLayer;
  active: boolean;
  tool: DungeonEditorTool;
  selectedObjectId: string | null;
  onLayerChange: (layer: DungeonEditLayer) => void;
  onActiveChange: (active: boolean) => void;
  onToolChange: (tool: DungeonEditorTool) => void;
  onSelectedObjectChange: (id: string | null) => void;
  onUpdated: (snapshot: RoomSnapshot) => void;
};

export function DungeonEditorPanel({
  roomId,
  scene,
  layer,
  active,
  tool,
  selectedObjectId,
  onLayerChange,
  onActiveChange,
  onToolChange,
  onSelectedObjectChange,
  onUpdated,
}: Props) {
  const [url, setUrl] = useState(scene.mapImageUrl ?? "");
  const [scale, setScale] = useState(String(scene.mapImageScale ?? 1));
  const [offX, setOffX] = useState(String(scene.mapImageOffsetX ?? 0));
  const [offY, setOffY] = useState(String(scene.mapImageOffsetY ?? 0));
  const [fog, setFog] = useState(Boolean(scene.fogEnabled));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrl(scene.mapImageUrl ?? "");
    setScale(String(scene.mapImageScale ?? 1));
    setOffX(String(scene.mapImageOffsetX ?? 0));
    setOffY(String(scene.mapImageOffsetY ?? 0));
    setFog(Boolean(scene.fogEnabled));
  }, [
    scene.mapImageUrl,
    scene.mapImageScale,
    scene.mapImageOffsetX,
    scene.mapImageOffsetY,
    scene.fogEnabled,
  ]);

  const hasFloorImage = Boolean(scene.mapImageUrl?.trim());
  const objectCount = dungeonObjectsOf(scene).length;
  const walls = dungeonObjectsOf(scene).filter((o) => o.kind === "wall").length;
  const objects = dungeonObjectsOf(scene).filter((o) => o.kind === "object").length;

  async function saveScene(patch: Parameters<typeof patchRoomScene>[1]) {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const snapshot = await patchRoomScene(roomId, patch);
      onUpdated(snapshot);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  async function applyFloor() {
    await saveScene({
      mapImageUrl: url.trim() || null,
      mapImageScale: Number(scale) || 1,
      mapImageOffsetX: Number(offX) || 0,
      mapImageOffsetY: Number(offY) || 0,
      fogEnabled: fog,
    });
    setMsg("Piso atualizado.");
  }

  async function onFloorFile(file: File) {
    setBusy(true);
    setMsg(null);
    try {
      const dataUrl = await buildMapImageFromFile(file);
      setUrl(dataUrl);
      const snapshot = await patchRoomScene(roomId, {
        mapImageUrl: dataUrl,
        mapImageScale: Number(scale) || 1,
        mapImageOffsetX: Number(offX) || 0,
        mapImageOffsetY: Number(offY) || 0,
        fogEnabled: fog,
      });
      onUpdated(snapshot);
      setMsg("Imagem de piso enviada.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setBusy(false);
    }
  }

  async function persistObjects(next: ReturnType<typeof dungeonObjectsOf>) {
    await saveScene({ dungeonObjects: next });
    setMsg("Camada de objetos atualizada.");
  }

  async function clearObjects() {
    if (!objectCount || busy) return;
    if (!window.confirm("Remover todos os objetos e paredes do mapa?")) return;
    await persistObjects([]);
    onSelectedObjectChange(null);
  }

  async function clearFog() {
    await saveScene({ revealedHexes: [] });
    setMsg("Fog resetada.");
  }

  const layerTabs: { id: DungeonEditLayer; label: string; hint: string }[] = [
    { id: "floor", label: "1 · Piso", hint: "Imagem de fundo abaixo do grid." },
    { id: "objects", label: "2 · Objetos", hint: "Paredes e props — bloqueiam tokens." },
    { id: "tokens", label: "3 · Tokens", hint: "Personagens no mapa — arraste no tabuleiro." },
  ];

  return (
    <div className="vtt-dungeon-panel">
      <div className="vtt-dungeon-panel-head">
        <p className="vtt-eyebrow" style={{ margin: 0 }}>
          Editor de masmorras
        </p>
        {layer === "objects" ? (
          <button
            type="button"
            className={`vtt-dungeon-toggle${active ? " vtt-dungeon-toggle--on" : ""}`}
            disabled={busy}
            onClick={() => onActiveChange(!active)}
          >
            {active ? "Pintando hex" : "Editar no mapa"}
          </button>
        ) : null}
      </div>

      <div className="vtt-dungeon-layer-tabs">
        {layerTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`vtt-dungeon-layer-tab${layer === tab.id ? " vtt-dungeon-layer-tab--on" : ""}`}
            disabled={busy}
            onClick={() => onLayerChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="vtt-combat-hint">{layerTabs.find((t) => t.id === layer)?.hint}</p>

      {layer === "objects" && active ? (
        <p className="vtt-dungeon-active-hint">
          Clique no hex para {tool === "erase" ? "apagar" : tool === "move" ? "mover/selecionar" : "colocar"}{" "}
          {tool === "wall" ? "parede" : tool === "object" ? "objeto" : ""}.
        </p>
      ) : null}

      {layer === "objects" ? (
        <>
          <div className="vtt-dungeon-tools">
            {(
              [
                ["wall", "Parede"],
                ["object", "Objeto"],
                ["erase", "Apagar"],
                ["move", "Mover"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`vtt-dungeon-tool${tool === id ? " vtt-dungeon-tool--on" : ""}`}
                disabled={!active || busy}
                onClick={() => onToolChange(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="vtt-dungeon-stats">
            {walls} paredes · {objects} objetos
            {selectedObjectId ? " · 1 selecionado" : ""}
          </p>
        </>
      ) : null}

      {layer === "tokens" ? (
        <p className="vtt-combat-hint">
          A camada de tokens é editada no mapa: arraste personagens, invoque monstros e use a ordem de
          turno. Cada token tem ID e ficha próprios.
        </p>
      ) : null}

      {layer === "floor" ? (
      <div className="vtt-dungeon-layer">
        <p className="vtt-eyebrow">Imagem de piso</p>
        {hasFloorImage ? (
          <p className="vtt-dungeon-floor-status">Fundo ativo no hex — ajuste escala/offset se precisar.</p>
        ) : (
          <p className="vtt-combat-hint">Suba uma imagem ou cole uma URL para usar como fundo do tabuleiro.</p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFloorFile(f);
            e.target.value = "";
          }}
        />
        <div className="vtt-dungeon-floor-actions">
          <button
            type="button"
            className="vtt-btn"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            Subir imagem
          </button>
          <button
            type="button"
            className="vtt-btn vtt-btn--ghost"
            disabled={busy || !url}
            onClick={() => {
              setUrl("");
              void saveScene({ mapImageUrl: null });
            }}
          >
            Remover piso
          </button>
        </div>
        <label className="vtt-field">
          <span>URL alternativa</span>
          <input
            type="url"
            value={url.startsWith("data:") ? "" : url}
            placeholder={url.startsWith("data:") ? "(imagem carregada)" : "https://…"}
            onChange={(e) => setUrl(e.target.value)}
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
        <button type="button" className="vtt-btn" disabled={busy} onClick={() => void applyFloor()}>
          Aplicar piso
        </button>
      </div>
      ) : null}

      {layer === "objects" ? (
      <div className="vtt-dungeon-layer">
        <p className="vtt-eyebrow">Fog of war</p>
        <label className="vtt-check">
          <input type="checkbox" checked={fog} onChange={(e) => setFog(e.target.checked)} />
          Fog of war ativa
        </label>
        <p className="vtt-combat-hint">
          Tokens não entram em hexes com parede/objeto. Ctrl+clique revela hex com névoa.
        </p>
        <div className="vtt-map-panel-actions">
          <button type="button" className="vtt-btn vtt-btn--ghost" disabled={busy || !objectCount} onClick={() => void clearObjects()}>
            Limpar objetos
          </button>
          {fog ? (
            <button type="button" className="vtt-btn vtt-btn--ghost" disabled={busy} onClick={() => void clearFog()}>
              Limpar revelados
            </button>
          ) : null}
        </div>
      </div>
      ) : null}

      {msg ? <p className="vtt-combat-hint">{msg}</p> : null}
    </div>
  );
}

export type DungeonHexEditResult = {
  snapshot?: RoomSnapshot;
  selectedId: string | null;
  error?: string;
};

/** Aplica edição de hex no mapa (chamado pelo canvas). */
export async function applyDungeonHexEdit(
  roomId: string,
  scene: BattleScene,
  tool: DungeonEditorTool,
  axial: { q: number; r: number },
  selectedObjectId: string | null
): Promise<DungeonHexEditResult> {
  const objects = dungeonObjectsOf(scene);

  if (tool === "erase") {
    const next = removeDungeonObjectAt(scene, axial);
    const snapshot = await patchRoomScene(roomId, { dungeonObjects: next });
    return { snapshot, selectedId: null };
  }

  if (tool === "move") {
    const at = objects.find((o) => o.q === axial.q && o.r === axial.r);
    if (at) {
      return { selectedId: at.id };
    }
    if (selectedObjectId) {
      const result = moveDungeonObject(scene, selectedObjectId, axial);
      if (!result.ok) {
        return { selectedId: selectedObjectId, error: result.error };
      }
      const snapshot = await patchRoomScene(roomId, { dungeonObjects: result.objects });
      return { snapshot, selectedId: selectedObjectId };
    }
    return { selectedId: null };
  }

  const kind: DungeonObjectKind = tool === "object" ? "object" : "wall";
  const result = addDungeonObject(scene, kind, axial);
  if (!result.ok) {
    return { selectedId: selectedObjectId, error: result.error };
  }
  const snapshot = await patchRoomScene(roomId, { dungeonObjects: result.objects });
  const placed = result.objects.find((o) => o.q === axial.q && o.r === axial.r);
  return { snapshot, selectedId: placed?.id ?? selectedObjectId };
}
