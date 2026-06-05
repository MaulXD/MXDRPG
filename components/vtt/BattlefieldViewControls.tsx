"use client";

type Props = {
  zoomPercent: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  showDungeonEditor?: boolean;
  dungeonEditorActive?: boolean;
  onToggleDungeonEditor?: () => void;
};

export function BattlefieldViewControls({
  zoomPercent,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  onReset,
  showDungeonEditor = false,
  dungeonEditorActive = false,
  onToggleDungeonEditor,
}: Props) {
  return (
    <div className="vtt-view-controls" role="toolbar" aria-label="Zoom e navegação do mapa">
      <button
        type="button"
        className="vtt-view-btn"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        title="Diminuir zoom"
        aria-label="Diminuir zoom"
      >
        −
      </button>
      <span className="vtt-view-zoom-label" title="Nível de zoom">
        {zoomPercent}%
      </span>
      <button
        type="button"
        className="vtt-view-btn"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        title="Aumentar zoom"
        aria-label="Aumentar zoom"
      >
        +
      </button>
      <button
        type="button"
        className="vtt-view-btn vtt-view-btn--reset"
        onClick={onReset}
        title="Centralizar e resetar zoom"
        aria-label="Resetar vista"
      >
        ⊙
      </button>
      {showDungeonEditor && onToggleDungeonEditor ? (
        <button
          type="button"
          className={`vtt-view-btn vtt-view-btn--dungeon${dungeonEditorActive ? " vtt-view-btn--dungeon-on" : ""}`}
          onClick={onToggleDungeonEditor}
          title="Modo masmorra — abre o painel na aba Piso para subir o fundo; Objetos para paredes"
          aria-label="Modo masmorra"
        >
          🏰
        </button>
      ) : null}
      <span className="vtt-view-hint">Scroll · Alt+arrastar</span>
    </div>
  );
}
