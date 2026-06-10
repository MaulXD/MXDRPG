"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  open: boolean;
  minimized?: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  children: ReactNode;
  className?: string;
};

/** Painel fixo na coluna esquerda (sem arrastar) — estilo Foundry. */
export function FoundryDockPanel({
  title,
  open,
  minimized = false,
  onClose,
  onMinimize,
  children,
  className = "",
}: Props) {
  if (!open) return null;

  return (
    <section
      className={`foundry-dock-panel foundry-dock-panel--open${minimized ? " foundry-dock-panel--minimized" : ""}${className ? ` ${className}` : ""}`}
      aria-label={title}
    >
      <header className="foundry-dock-panel__header">
        <h2 className="foundry-dock-panel__title">{title}</h2>
        <div className="foundry-dock-panel__actions">
          {onMinimize ? (
            <button
              type="button"
              className="foundry-dock-panel__btn"
              onClick={onMinimize}
              title={minimized ? "Expandir" : "Recolher"}
              aria-label={minimized ? "Expandir painel" : "Recolher painel"}
            >
              {minimized ? "▢" : "−"}
            </button>
          ) : null}
          <button
            type="button"
            className="foundry-dock-panel__btn foundry-dock-panel__btn--close"
            onClick={onClose}
            title="Fechar"
            aria-label="Fechar painel"
          >
            ×
          </button>
        </div>
      </header>
      {!minimized ? <div className="foundry-dock-panel__body">{children}</div> : null}
    </section>
  );
}
