"use client";

import type { MesaWindowId } from "@/hooks/vtt/useFoundryWindows";
import "./foundry.css";

type IconDef = {
  id: MesaWindowId;
  label: string;
  glyph: string;
  section: "mesa" | "gm";
  show?: boolean;
};

type Props = {
  isActive: (id: MesaWindowId) => boolean;
  onToggle: (id: MesaWindowId) => void;
  showGm?: boolean;
};

export function MesaIconBar({ isActive, onToggle, showGm = false }: Props) {
  const icons: IconDef[] = [
    { id: "actors", label: "Personagens", glyph: "👥", section: "mesa" },
    { id: "initiative", label: "Ordem de turnos", glyph: "⏱", section: "mesa" },
    { id: "chat", label: "Chat", glyph: "💬", section: "mesa" },
    { id: "dice", label: "Dados", glyph: "🎲", section: "mesa" },
    { id: "ficha", label: "Ficha", glyph: "📜", section: "mesa" },
    { id: "gm", label: "Menu do mestre", glyph: "⚙", section: "gm", show: showGm },
    { id: "spawn", label: "Invocar monstros", glyph: "☠", section: "gm", show: showGm },
  ];

  const mesaIcons = icons.filter((i) => i.section === "mesa" && i.show !== false);
  const gmIcons = icons.filter((i) => i.section === "gm" && i.show !== false);

  return (
    <nav className="foundry-icon-bar" aria-label="Painéis da mesa">
      <div className="foundry-icon-bar__section" aria-label="Mesa">
        {mesaIcons.map((icon) => (
          <button
            key={icon.id}
            type="button"
            className={`foundry-icon-bar__btn${isActive(icon.id) ? " foundry-icon-bar__btn--active" : ""}`}
            onClick={() => onToggle(icon.id)}
            title={icon.label}
            aria-label={icon.label}
            aria-pressed={isActive(icon.id)}
          >
            <span className="foundry-icon-bar__glyph" aria-hidden>
              {icon.glyph}
            </span>
          </button>
        ))}
      </div>

      {gmIcons.length > 0 ? (
        <>
          <div className="foundry-icon-bar__divider" role="separator" aria-hidden />
          <div className="foundry-icon-bar__section foundry-icon-bar__section--gm" aria-label="Mestre">
            {gmIcons.map((icon) => (
              <button
                key={icon.id}
                type="button"
                className={`foundry-icon-bar__btn foundry-icon-bar__btn--gm${isActive(icon.id) ? " foundry-icon-bar__btn--active" : ""}`}
                onClick={() => onToggle(icon.id)}
                title={icon.label}
                aria-label={icon.label}
                aria-pressed={isActive(icon.id)}
              >
                <span className="foundry-icon-bar__glyph" aria-hidden>
                  {icon.glyph}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </nav>
  );
}
