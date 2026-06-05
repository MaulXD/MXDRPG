"use client";

import type { MesaWindowId } from "@/hooks/vtt/useFoundryWindows";
import { MesaRailIcon, type MesaRailIconName } from "@/components/vtt/foundry/MesaRailIcon";
import "./foundry.css";

type IconDef = {
  id: MesaWindowId;
  label: string;
  icon: MesaRailIconName;
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
    { id: "actors", label: "Personagens", icon: "actors", section: "mesa" },
    { id: "initiative", label: "Ordem de turnos", icon: "initiative", section: "mesa" },
    { id: "chat", label: "Chat", icon: "chat", section: "mesa" },
    { id: "dice", label: "Dados", icon: "dice", section: "mesa" },
    { id: "ficha", label: "Ficha", icon: "ficha", section: "mesa" },
    { id: "gm", label: "Menu do mestre", icon: "gm", section: "gm", show: showGm },
    { id: "spawn", label: "Invocar monstros", icon: "spawn", section: "gm", show: showGm },
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
            <MesaRailIcon name={icon.icon} />
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
                <MesaRailIcon name={icon.icon} />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </nav>
  );
}
