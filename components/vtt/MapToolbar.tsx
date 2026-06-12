"use client";

import {
  MARKUP_COLORS,
  MARKUP_WIDTHS,
  type WhiteboardTool,
} from "@/lib/vtt/map-markup";
import type { MapToolMode } from "@/lib/vtt/map-toolbar";
import { MapToolbarIcon } from "@/components/vtt/MapToolbarIcon";
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
  label: string;
  title: string;
  section: "map" | "draw";
};

const MAP_TOOLS: ToolBtn[] = [
  { id: "token", label: "Interagir", title: "Selecionar tokens e jogar (padrão)", section: "map" },
  { id: "ping", label: "Ping", title: "Clique no mapa para marcar posição para o grupo", section: "map" },
  { id: "measure", label: "Régua", title: "Arraste no mapa para medir distância em células e metros", section: "map" },
  { id: "fog", label: "Névoa", title: "Clique para revelar célula (mestre)", section: "map" },
];

const DRAW_TOOLS: ToolBtn[] = [
  { id: "select", label: "Selecionar", title: "Selecionar e mover desenho (Del apaga)", section: "draw" },
  { id: "pen", label: "Livre", title: "Traço livre", section: "draw" },
  { id: "line", label: "Linha", title: "Segmento reto", section: "draw" },
  { id: "arrow", label: "Seta", title: "Seta indicativa", section: "draw" },
  { id: "shape", label: "Retângulo", title: "Arraste retângulo", section: "draw" },
  { id: "circle", label: "Círculo", title: "Arraste círculo", section: "draw" },
  { id: "text", label: "Texto", title: "Clique para rotular", section: "draw" },
];

function drawHint(tool: WhiteboardTool): string {
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
    if (mapToolMode === mode && mode !== "token") {
      onMapToolModeChange("token");
      return;
    }
    onMapToolModeChange(mode);
  };

  const pickDrawTool = (tool: WhiteboardTool) => {
    if (mapToolMode === "draw" && drawTool === tool) {
      onMapToolModeChange("token");
      return;
    }
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
      className="map-toolbar-shell"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="map-toolbar" role="toolbar" aria-label="Ferramentas do mapa">
      <p className="map-toolbar__foot-hint">Scroll zoom · Alt+arrastar pano</p>
      <p className="map-toolbar__section-label">Mapa</p>
      <div className="map-toolbar__group" role="group" aria-label="Ferramentas de mapa">
        {mapTools.map((t) => {
          const mode = t.id as MapToolMode;
          const active = mapToolMode === mode;
          return (
            <button
              key={t.id}
              type="button"
              data-tool-icon={mode}
              className={`map-toolbar__btn${active ? " map-toolbar__btn--active" : ""}`}
              title={t.title}
              aria-label={t.label}
              aria-pressed={active}
              disabled={busy || (mode === "ping" && !canPing)}
              onClick={() => pickMapTool(mode)}
            >
              <MapToolbarIcon name={mode} />
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
                  data-tool-icon={tool}
                  className={`map-toolbar__btn${active ? " map-toolbar__btn--active" : ""}`}
                  title={t.title}
                  aria-label={t.label}
                  aria-pressed={active}
                  disabled={busy}
                  onClick={() => pickDrawTool(tool)}
                >
                  <MapToolbarIcon name={tool} />
                </button>
              );
            })}
          </div>

        </>
      ) : null}

      <div className="map-toolbar__divider" aria-hidden />

      {showDungeonEditor && onToggleDungeonEditor ? (
        <>
          <button
            type="button"
            data-tool-icon="dungeon"
            className={`map-toolbar__btn map-toolbar__btn--wide${dungeonEditorActive ? " map-toolbar__btn--active" : ""}`}
            title="Editor de mapa — piso, paredes e objetos"
            aria-label="Editor de masmorra"
            aria-pressed={dungeonEditorActive}
            onClick={onToggleDungeonEditor}
          >
            <MapToolbarIcon name="dungeon" />
          </button>
          <div className="map-toolbar__divider" aria-hidden />
        </>
      ) : null}

      <p className="map-toolbar__section-label">Zoom</p>
      <div className="map-toolbar__zoom" role="group" aria-label="Zoom">
        <button
          type="button"
          data-tool-icon="zoom-out"
          className="map-toolbar__btn"
          onClick={onZoomOut}
          disabled={!canZoomOut}
          title="Diminuir zoom"
          aria-label="Diminuir zoom"
        >
          <MapToolbarIcon name="zoom-out" />
        </button>
        <span className="map-toolbar__zoom-label">{zoomPercent}%</span>
        <button
          type="button"
          data-tool-icon="zoom-in"
          className="map-toolbar__btn"
          onClick={onZoomIn}
          disabled={!canZoomIn}
          title="Aumentar zoom"
          aria-label="Aumentar zoom"
        >
          <MapToolbarIcon name="zoom-in" />
        </button>
        <button
          type="button"
          data-tool-icon="reset-view"
          className="map-toolbar__btn"
          onClick={onResetView}
          title="Centralizar e resetar zoom"
          aria-label="Resetar vista"
        >
          <MapToolbarIcon name="reset-view" />
        </button>
      </div>
      </div>

      {canUseDraw && mapToolMode === "draw" ? (
        <div className="map-toolbar__flyout" role="group" aria-label="Opções de desenho">
          <p className="map-toolbar__flyout-label">Cor</p>
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
          <p className="map-toolbar__flyout-label">Espessura</p>
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
    </div>
  );
}
