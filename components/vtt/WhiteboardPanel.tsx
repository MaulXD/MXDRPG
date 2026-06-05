"use client";

import { useState } from "react";
import type { BattleScene, MapMarkupDurability } from "@/lib/vtt/types";
import type { RoomSnapshot } from "@/lib/room/types";
import { patchRoomScene } from "@/hooks/useRoomSync";
import {
  mapMarkupsOf,
  MARKUP_COLORS,
  MARKUP_WIDTHS,
  pruneMapMarkups,
  type WhiteboardTool,
} from "@/lib/vtt/map-markup";

type Props = {
  roomId: string;
  scene: BattleScene;
  active: boolean;
  tool: WhiteboardTool;
  color: string;
  width: number;
  durability: MapMarkupDurability;
  markupCount: number;
  tempCount: number;
  onActiveChange: (active: boolean) => void;
  onToolChange: (tool: WhiteboardTool) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onDurabilityChange: (durability: MapMarkupDurability) => void;
  onUpdated: (snapshot: RoomSnapshot) => void;
};

const TOOLS: { id: WhiteboardTool; label: string; hint: string }[] = [
  { id: "pen", label: "Livre", hint: "Desenho à mão livre" },
  { id: "line", label: "Linha", hint: "Segmento reto" },
  { id: "arrow", label: "Seta", hint: "Indicar direção" },
  { id: "rect", label: "Retângulo", hint: "Área retangular" },
  { id: "circle", label: "Círculo", hint: "Área circular" },
  { id: "text", label: "Texto", hint: "Clique no mapa para rotular" },
  { id: "move", label: "Mover", hint: "Arraste um desenho" },
  { id: "erase", label: "Apagar", hint: "Clique para remover" },
];

export function WhiteboardPanel({
  roomId,
  scene,
  active,
  tool,
  color,
  width,
  durability,
  markupCount,
  tempCount,
  onActiveChange,
  onToolChange,
  onColorChange,
  onWidthChange,
  onDurabilityChange,
  onUpdated,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function saveMarkups(next: ReturnType<typeof mapMarkupsOf>) {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const snapshot = await patchRoomScene(roomId, { mapMarkups: next });
      onUpdated(snapshot);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar lousa");
    } finally {
      setBusy(false);
    }
  }

  async function clearTemporary() {
    const markups = mapMarkupsOf(scene);
    const next = markups.filter((m) => m.durability !== "temporary");
    if (next.length === markups.length) {
      setMsg("Nenhuma marcação temporária.");
      return;
    }
    await saveMarkups(next);
    setMsg("Marcações temporárias removidas.");
  }

  async function clearPermanent() {
    const markups = mapMarkupsOf(scene);
    const perm = markups.filter((m) => m.durability === "permanent").length;
    if (!perm) {
      setMsg("Nenhuma marcação permanente.");
      return;
    }
    if (!window.confirm(`Remover ${perm} marcação(ões) permanente(s)?`)) return;
    const next = markups.filter((m) => m.durability !== "permanent");
    await saveMarkups(next);
    setMsg("Marcações permanentes removidas.");
  }

  async function clearAll() {
    if (!markupCount) {
      setMsg("Lousa já está vazia.");
      return;
    }
    if (!window.confirm("Limpar toda a lousa (temporária + permanente)?")) return;
    await saveMarkups([]);
    setMsg("Lousa limpa.");
  }

  return (
    <div className="whiteboard-panel vtt-sidebar">
      <p className="vtt-combat-hint whiteboard-panel__lead">
        Desenhe marcações sobre o mapa. <strong>Temporária</strong> some após ~30 min;{" "}
        <strong>permanente</strong> fica na cena até você apagar.
      </p>

      <label className="whiteboard-panel__toggle">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => onActiveChange(e.target.checked)}
        />
        <span>Modo lousa no mapa</span>
      </label>

      <div className="whiteboard-panel__section">
        <span className="whiteboard-panel__label">Ferramenta</span>
        <div className="whiteboard-panel__tools" role="group" aria-label="Ferramentas da lousa">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`whiteboard-panel__tool${tool === t.id ? " whiteboard-panel__tool--active" : ""}`}
              title={t.hint}
              disabled={!active && t.id !== "move" && t.id !== "erase"}
              onClick={() => onToolChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="whiteboard-panel__section">
        <span className="whiteboard-panel__label">Cor</span>
        <div className="whiteboard-panel__colors" role="group" aria-label="Cor do traço">
          {MARKUP_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`whiteboard-panel__swatch${color === c ? " whiteboard-panel__swatch--active" : ""}`}
              style={{ background: c }}
              aria-label={`Cor ${c}`}
              onClick={() => onColorChange(c)}
            />
          ))}
        </div>
      </div>

      <div className="whiteboard-panel__section">
        <span className="whiteboard-panel__label">Espessura</span>
        <div className="whiteboard-panel__widths" role="group" aria-label="Espessura do traço">
          {MARKUP_WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              className={`whiteboard-panel__width${width === w ? " whiteboard-panel__width--active" : ""}`}
              onClick={() => onWidthChange(w)}
            >
              {w}px
            </button>
          ))}
        </div>
      </div>

      <div className="whiteboard-panel__section">
        <span className="whiteboard-panel__label">Duração</span>
        <div className="whiteboard-panel__durability" role="group" aria-label="Duração da marcação">
          <button
            type="button"
            className={`whiteboard-panel__dur-btn${durability === "temporary" ? " whiteboard-panel__dur-btn--active" : ""}`}
            onClick={() => onDurabilityChange("temporary")}
          >
            Temporária
          </button>
          <button
            type="button"
            className={`whiteboard-panel__dur-btn${durability === "permanent" ? " whiteboard-panel__dur-btn--active" : ""}`}
            onClick={() => onDurabilityChange("permanent")}
          >
            Permanente
          </button>
        </div>
      </div>

      <p className="vtt-combat-hint whiteboard-panel__stats">
        {pruneMapMarkups(mapMarkupsOf(scene)).length} no mapa ({tempCount} temp. ·{" "}
        {markupCount - tempCount} perm.)
      </p>

      <div className="whiteboard-panel__actions">
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void clearTemporary()}>
          Limpar temporárias
        </button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void clearPermanent()}>
          Limpar permanentes
        </button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => void clearAll()}>
          Limpar tudo
        </button>
      </div>

      {msg ? <p className="vtt-combat-hint whiteboard-panel__msg">{msg}</p> : null}
      {!active ? (
        <p className="vtt-combat-hint">Ative o modo lousa para desenhar no mapa.</p>
      ) : tool === "move" ? (
        <p className="vtt-combat-hint">Clique e arraste uma marcação para reposicioná-la.</p>
      ) : tool === "erase" ? (
        <p className="vtt-combat-hint">Clique numa marcação para removê-la.</p>
      ) : tool === "text" ? (
        <p className="vtt-combat-hint">Clique no mapa e digite o rótulo.</p>
      ) : (
        <p className="vtt-combat-hint">Arraste no mapa para desenhar. Solte para confirmar.</p>
      )}
    </div>
  );
}
