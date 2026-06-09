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
  canManageAll: boolean;
  onActiveChange: (active: boolean) => void;
  onToolChange: (tool: WhiteboardTool) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onDurabilityChange: (durability: MapMarkupDurability) => void;
  onUpdated: (snapshot: RoomSnapshot) => void;
};

const TOOL_ROWS: { id: WhiteboardTool; label: string; hint: string }[] = [
  { id: "select", label: "Selecionar", hint: "Clique num desenho · arraste para mover · Delete/Backspace apaga" },
  { id: "pen", label: "Traço livre", hint: "Como quadro branco — arraste no mapa" },
  { id: "shape", label: "Retângulo", hint: "Arraste retângulo no mapa" },
  { id: "circle", label: "Círculo", hint: "Arraste círculo no mapa" },
  { id: "line", label: "Linha", hint: "Segmento entre dois pontos" },
  { id: "arrow", label: "Seta", hint: "Seta indicativa entre dois pontos" },
  { id: "text", label: "Texto", hint: "Clique no mapa e digite o rótulo" },
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
  canManageAll,
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
    setMsg("Desenhos de sessão removidos.");
  }

  async function clearPermanent() {
    if (!canManageAll) return;
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
    if (!canManageAll) return;
    if (!markupCount) {
      setMsg("Lousa já está vazia.");
      return;
    }
    if (!window.confirm("Limpar toda a lousa (temporária + permanente)?")) return;
    await saveMarkups([]);
    setMsg("Lousa limpa.");
  }

  const activeHint = TOOL_ROWS.find((t) => t.id === tool)?.hint;

  return (
    <div className="whiteboard-panel vtt-sidebar">
      <p className="vtt-eyebrow" style={{ marginTop: 0 }}>
        Lousa do mapa
      </p>
      <p className="vtt-combat-hint whiteboard-panel__lead">
        Camada de desenho vetorial sobre o tabuleiro — como no Roll20.{" "}
        <strong>Jogadores e mestre</strong> podem anotar rotas, áreas e texto. Use a barra à
        esquerda do mapa ou este painel para ajustes.
      </p>

      <label className="whiteboard-panel__toggle">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => onActiveChange(e.target.checked)}
        />
        <span>Modo desenho ativo</span>
      </label>

      <div className="whiteboard-panel__section">
        <span className="whiteboard-panel__label">Ferramenta</span>
        <div className="whiteboard-panel__tools" role="group" aria-label="Ferramentas da lousa">
          {TOOL_ROWS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`whiteboard-panel__tool${tool === t.id ? " whiteboard-panel__tool--active" : ""}`}
              title={t.hint}
              disabled={busy}
              onClick={() => {
                if (!active) onActiveChange(true);
                onToolChange(t.id);
              }}
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
        <span className="whiteboard-panel__label">Duração do traço</span>
        <div className="whiteboard-panel__durability" role="group" aria-label="Duração da marcação">
          <button
            type="button"
            className={`whiteboard-panel__dur-btn${durability === "temporary" ? " whiteboard-panel__dur-btn--active" : ""}`}
            onClick={() => onDurabilityChange("temporary")}
          >
            Sessão (~30 min)
          </button>
          <button
            type="button"
            className={`whiteboard-panel__dur-btn${durability === "permanent" ? " whiteboard-panel__dur-btn--active" : ""}`}
            onClick={() => onDurabilityChange("permanent")}
            disabled={!canManageAll}
            title={canManageAll ? undefined : "Só o mestre pode marcar permanente"}
          >
            Permanente
          </button>
        </div>
        {!canManageAll ? (
          <p className="vtt-combat-hint" style={{ margin: "0.35rem 0 0" }}>
            Jogadores usam traços de <strong>sessão</strong> por padrão.
          </p>
        ) : null}
      </div>

      <p className="vtt-combat-hint whiteboard-panel__stats">
        {pruneMapMarkups(mapMarkupsOf(scene)).length} no mapa ({tempCount} sessão ·{" "}
        {markupCount - tempCount} perm.)
      </p>

      <div className="whiteboard-panel__actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy}
          onClick={() => void clearTemporary()}
        >
          Limpar sessão
        </button>
        {canManageAll ? (
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={busy}
              onClick={() => void clearPermanent()}
            >
              Limpar permanentes
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={busy}
              onClick={() => void clearAll()}
            >
              Limpar tudo
            </button>
          </>
        ) : null}
      </div>

      {msg ? <p className="vtt-combat-hint whiteboard-panel__msg">{msg}</p> : null}
      {!active ? (
        <p className="vtt-combat-hint">Ative o modo desenho ou escolha uma ferramenta na barra do mapa.</p>
      ) : activeHint ? (
        <p className="vtt-combat-hint">{activeHint}</p>
      ) : null}
    </div>
  );
}
