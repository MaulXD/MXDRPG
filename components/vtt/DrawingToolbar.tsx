"use client";

import {
  MARKUP_COLORS,
  MARKUP_WIDTHS,
  type WhiteboardTool,
} from "@/lib/vtt/map-markup";
import { MapToolbarIcon } from "@/components/vtt/MapToolbarIcon";
import { IconCheck, IconPencil } from "@/components/ui/EldarinIcons";
import "./whiteboard.css";

type Props = {
  active: boolean;
  tool: WhiteboardTool;
  color: string;
  width: number;
  canManageAll: boolean;
  busy?: boolean;
  onActiveChange: (active: boolean) => void;
  onToolChange: (tool: WhiteboardTool) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onClearSession?: () => void;
};

const TOOLS: { id: WhiteboardTool; label: string; title: string }[] = [
  { id: "select", label: "Selecionar", title: "Selecionar e mover (Delete apaga)" },
  { id: "pen", label: "Livre", title: "Traço livre" },
  { id: "shape", label: "Retângulo", title: "Arraste retângulo" },
  { id: "circle", label: "Círculo", title: "Arraste círculo" },
  { id: "line", label: "Linha", title: "Segmento reto" },
  { id: "text", label: "Texto", title: "Clique no mapa para rotular" },
];

export function DrawingToolbar({
  active,
  tool,
  color,
  width,
  canManageAll,
  busy = false,
  onActiveChange,
  onToolChange,
  onColorChange,
  onWidthChange,
  onClearSession,
}: Props) {
  const pickTool = (id: WhiteboardTool) => {
    if (!active) onActiveChange(true);
    onToolChange(id);
  };

  return (
    <div
      className={`drawing-toolbar${active ? "" : " drawing-toolbar--off"}`}
      role="toolbar"
      aria-label="Ferramentas de desenho"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={`drawing-toolbar__toggle${active ? " drawing-toolbar__toggle--on" : ""}`}
        title={active ? "Desativar lousa" : "Ativar lousa"}
        aria-pressed={active}
        onClick={() => onActiveChange(!active)}
      >
        {active ? <IconCheck size={14} /> : <IconPencil size={14} />}
      </button>

      <div className="drawing-toolbar__tools" role="group" aria-label="Ferramentas">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`drawing-toolbar__tool${active && tool === t.id ? " drawing-toolbar__tool--active" : ""}`}
            title={t.title}
            aria-label={t.label}
            aria-pressed={active && tool === t.id}
            disabled={busy}
            onClick={() => pickTool(t.id)}
          >
            <MapToolbarIcon name={t.id} />
          </button>
        ))}
      </div>

      {active ? (
        <div className="drawing-toolbar__sub">
          <div className="drawing-toolbar__colors" role="group" aria-label="Cor">
            {MARKUP_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`drawing-toolbar__swatch${color === c ? " drawing-toolbar__swatch--active" : ""}`}
                style={{ background: c }}
                aria-label={`Cor ${c}`}
                onClick={() => onColorChange(c)}
              />
            ))}
          </div>
          <div className="drawing-toolbar__widths" role="group" aria-label="Espessura">
            {MARKUP_WIDTHS.map((w) => (
              <button
                key={w}
                type="button"
                className={`drawing-toolbar__width${width === w ? " drawing-toolbar__width--active" : ""}`}
                onClick={() => onWidthChange(w)}
              >
                {w}px
              </button>
            ))}
          </div>
          {canManageAll && onClearSession ? (
            <button
              type="button"
              className="drawing-toolbar__clear"
              disabled={busy}
              title="Remove desenhos temporários da sessão"
              onClick={onClearSession}
            >
              Limpar sessão
            </button>
          ) : null}
          <p className="drawing-toolbar__hint">
            {tool === "select"
              ? "Del apaga"
              : tool === "text"
                ? "Clique no mapa"
                : "Arraste no mapa"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
