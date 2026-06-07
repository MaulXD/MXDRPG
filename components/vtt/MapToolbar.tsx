"use client";

import {
  MARKUP_COLORS,
  MARKUP_WIDTHS,
  type WhiteboardTool,
} from "@/lib/vtt/map-markup";
import type { MapToolMode } from "@/lib/vtt/map-toolbar";
import "./whiteboard.css";

type Props = {
  mapToolMode: MapToolMode;
  onMapToolModeChange: (mode: MapToolMode) => void;
  drawTool: WhiteboardTool;
  onDrawToolChange: (tool: WhiteboardTool) => void;
  color: string;
  width: number;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  canUseDraw: boolean;
  canManageAll: boolean;
  canPing: boolean;
  showFogTool: boolean;
  busy?: boolean;
  onClearSession?: () => void;
  zoomPercent: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  showDungeonEditor?: boolean;
  dungeonEditorActive?: boolean;
  onToggleDungeonEditor?: () => void;
};

type ToolBtn = {
  id: MapToolMode | WhiteboardTool;
  glyph: string;
  label: string;
  title: string;
  section: "map" | "draw";
};

const MAP_TOOLS: ToolBtn[] = [
  { id: "token", glyph: "↖", label: "Interagir", title: "Selecionar tokens e jogar (padrão)", section: "map" },
  { id: "ping", glyph: "◎", label: "Ping", title: "Clique no mapa para marcar posição para o grupo", section: "map" },
  { id: "measure", glyph: "📏", label: "Régua", title: "Arraste no mapa para medir distância em hex e metros", section: "map" },
  { id: "fog", glyph: "◐", label: "Névoa", title: "Clique para revelar hex (mestre)", section: "map" },
];

const DRAW_TOOLS: ToolBtn[] = [
  { id: "select", glyph: "⬚", label: "Selecionar", title: "Selecionar e mover desenho (Del apaga)", section: "draw" },
  { id: "pen", glyph: "✎", label: "Livre", title: "Traço livre", section: "draw" },
  { id: "line", glyph: "／", label: "Linha", title: "Segmento reto", section: "draw" },
  { id: "arrow", glyph: "➤", label: "Seta", title: "Seta indicativa", section: "draw" },
  { id: "shape", glyph: "▢", label: "Forma", title: "Retângulo · Alt = círculo", section: "draw" },
  { id: "polygon", glyph: "⬡", label: "Polígono", title: "Clique vértices · fecha no 1º ponto", section: "draw" },
  { id: "text", glyph: "T", label: "Texto", title: "Clique para rotular", section: "draw" },
];

function drawHint(tool: WhiteboardTool): string {
  if (tool === "shape") return "Alt: círculo";
  if (tool === "polygon") return "Fecha no 1º ponto";
  if (tool === "select") return "Del apaga";
  if (tool === "text") return "Clique no mapa";
  return "Arraste no mapa";
}

export function MapToolbar({
  mapToolMode,
  onMapToolModeChange,
  drawTool,
  onDrawToolChange,
  color,
  width,
  onColorChange,
  onWidthChange,
  canUseDraw,
  canManageAll,
  canPing,
  showFogTool,
  busy = false,
  onClearSession,
  zoomPercent,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  onResetView,
  showDungeonEditor = false,
  dungeonEditorActive = false,
  onToggleDungeonEditor,
}: Props) {
  const pickMapTool = (mode: MapToolMode) => {
    if (mode === "ping" && !canPing) return;
    if (mode === "fog" && !showFogTool) return;
    onMapToolModeChange(mode);
  };

  const pickDrawTool = (tool: WhiteboardTool) => {
    onMapToolModeChange("draw");
    onDrawToolChange(tool);
  };

  const mapTools = MAP_TOOLS.filter((t) => {
    if (t.id === "ping" && !canPing) return false;
    if (t.id === "fog" && !showFogTool) return false;
    return true;
  });

  return (
    <div
      className="map-toolbar"
      role="toolbar"
      aria-label="Ferramentas do mapa"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <p className="map-toolbar__section-label">Mapa</p>
      <div className="map-toolbar__group" role="group" aria-label="Ferramentas de mapa">
        {mapTools.map((t) => {
          const mode = t.id as MapToolMode;
          const active = mapToolMode === mode;
          return (
            <button
              key={t.id}
              type="button"
              className={`map-toolbar__btn${active ? " map-toolbar__btn--active" : ""}`}
              title={t.title}
              aria-label={t.label}
              aria-pressed={active}
              disabled={busy || (mode === "ping" && !canPing)}
              onClick={() => pickMapTool(mode)}
            >
              {t.glyph}
            </button>
          );
        })}
      </div>

      {canUseDraw ? (
        <>
          <div className="map-toolbar__divider" aria-hidden />
          <p className="map-toolbar__section-label">Desenho</p>
          <div className="map-toolbar__group" role="group" aria-label="Ferramentas de desenho">
            {DRAW_TOOLS.map((t) => {
              const tool = t.id as WhiteboardTool;
              const active = mapToolMode === "draw" && drawTool === tool;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`map-toolbar__btn${active ? " map-toolbar__btn--active" : ""}`}
                  title={t.title}
                  aria-label={t.label}
                  aria-pressed={active}
                  disabled={busy}
                  onClick={() => pickDrawTool(tool)}
                >
                  {t.glyph}
                </button>
              );
            })}
          </div>

          {mapToolMode === "draw" ? (
            <div className="map-toolbar__sub">
              <div className="map-toolbar__colors" role="group" aria-label="Cor">
                {MARKUP_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`map-toolbar__swatch${color === c ? " map-toolbar__swatch--active" : ""}`}
                    style={{ background: c }}
                    aria-label={`Cor ${c}`}
                    onClick={() => onColorChange(c)}
                  />
                ))}
              </div>
              <div className="map-toolbar__widths" role="group" aria-label="Espessura">
                {MARKUP_WIDTHS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    className={`map-toolbar__width${width === w ? " map-toolbar__width--active" : ""}`}
                    onClick={() => onWidthChange(w)}
                  >
                    {w}px
                  </button>
                ))}
              </div>
              {canManageAll && onClearSession ? (
                <button
                  type="button"
                  className="map-toolbar__clear"
                  disabled={busy}
                  title="Remove desenhos temporários da sessão"
                  onClick={onClearSession}
                >
                  Limpar sessão
                </button>
              ) : null}
              <p className="map-toolbar__hint">{drawHint(drawTool)}</p>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="map-toolbar__divider" aria-hidden />

      {showDungeonEditor && onToggleDungeonEditor ? (
        <>
          <button
            type="button"
            className={`map-toolbar__btn map-toolbar__btn--wide${dungeonEditorActive ? " map-toolbar__btn--active" : ""}`}
            title="Editor de mapa — piso, paredes e objetos"
            aria-label="Editor de masmorra"
            aria-pressed={dungeonEditorActive}
            onClick={onToggleDungeonEditor}
          >
            🏰
          </button>
          <div className="map-toolbar__divider" aria-hidden />
        </>
      ) : null}

      <p className="map-toolbar__section-label">Zoom</p>
      <div className="map-toolbar__zoom" role="group" aria-label="Zoom">
        <button
          type="button"
          className="map-toolbar__btn"
          onClick={onZoomOut}
          disabled={!canZoomOut}
          title="Diminuir zoom"
          aria-label="Diminuir zoom"
        >
          −
        </button>
        <span className="map-toolbar__zoom-label">{zoomPercent}%</span>
        <button
          type="button"
          className="map-toolbar__btn"
          onClick={onZoomIn}
          disabled={!canZoomIn}
          title="Aumentar zoom"
          aria-label="Aumentar zoom"
        >
          +
        </button>
        <button
          type="button"
          className="map-toolbar__btn"
          onClick={onResetView}
          title="Centralizar e resetar zoom"
          aria-label="Resetar vista"
        >
          ⊙
        </button>
      </div>
      <p className="map-toolbar__foot-hint">Scroll zoom · Alt+arrastar pano</p>
    </div>
  );
}
