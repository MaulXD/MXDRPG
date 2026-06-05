"use client";

import type { MesaWindowId } from "@/hooks/vtt/useFoundryWindows";
import { MesaRailIcon, type MesaRailIconName } from "@/components/vtt/foundry/MesaRailIcon";
import "./foundry.css";

type IconDef = {
  id: MesaWindowId;
  label: string;
  icon: MesaRailIconName;
  section: "play" | "gm";
  show?: boolean;
};

type Props = {
  isActive: (id: MesaWindowId) => boolean;
  onToggle: (id: MesaWindowId) => void;
  onOpenPopup?: (id: MesaWindowId) => void;
  showGm?: boolean;
};

function IconButton({
  icon,
  active,
  onToggle,
  onOpenPopup,
  gm,
}: {
  icon: IconDef;
  active: boolean;
  onToggle: (id: MesaWindowId) => void;
  onOpenPopup?: (id: MesaWindowId) => void;
  gm?: boolean;
}) {
  return (
    <button
      type="button"
      className={`foundry-icon-bar__btn${active ? " foundry-icon-bar__btn--active" : ""}${gm ? " foundry-icon-bar__btn--gm" : ""}`}
      onClick={() => onToggle(icon.id)}
      onContextMenu={(e) => {
        if (!onOpenPopup) return;
        e.preventDefault();
        onOpenPopup(icon.id);
      }}
      title={onOpenPopup ? `${icon.label} — clique direito: janela flutuante` : icon.label}
      aria-label={icon.label}
      aria-pressed={active}
    >
      <MesaRailIcon name={icon.icon} />
      <span className="foundry-icon-bar__label">{icon.label}</span>
    </button>
  );
}

export function MesaIconBar({ isActive, onToggle, onOpenPopup, showGm = false }: Props) {
  const icons: IconDef[] = [
    { id: "actors", label: "Tokens", icon: "actors", section: "play" },
    { id: "initiative", label: "Turno", icon: "initiative", section: "play" },
    { id: "ficha", label: "Ficha", icon: "ficha", section: "play" },
    { id: "chat", label: "Chat", icon: "chat", section: "play" },
    { id: "dice", label: "Dados", icon: "dice", section: "play" },
    { id: "dungeon", label: "Mapa", icon: "dungeon", section: "gm", show: showGm },
    { id: "whiteboard", label: "Lousa", icon: "whiteboard", section: "gm", show: showGm },
    { id: "gm", label: "Mestre", icon: "gm", section: "gm", show: showGm },
    { id: "spawn", label: "Invocar", icon: "spawn", section: "gm", show: showGm },
  ];

  const playIcons = icons.filter((i) => i.section === "play" && i.show !== false);
  const gmIcons = icons.filter((i) => i.section === "gm" && i.show !== false);

  return (
    <nav className="foundry-icon-bar" aria-label="Atalhos dos painéis">
      <p className="foundry-icon-bar__section-title">Jogo</p>
      <div className="foundry-icon-bar__section">
        {playIcons.map((icon) => (
          <IconButton
            key={icon.id}
            icon={icon}
            active={isActive(icon.id)}
            onToggle={onToggle}
            onOpenPopup={onOpenPopup}
          />
        ))}
      </div>

      {gmIcons.length > 0 ? (
        <>
          <div className="foundry-icon-bar__divider" role="separator" aria-hidden />
          <p className="foundry-icon-bar__section-title foundry-icon-bar__section-title--gm">
            Mestre
          </p>
          <div className="foundry-icon-bar__section foundry-icon-bar__section--gm">
            {gmIcons.map((icon) => (
              <IconButton
                key={icon.id}
                icon={icon}
                active={isActive(icon.id)}
                onToggle={onToggle}
                onOpenPopup={onOpenPopup}
                gm
              />
            ))}
          </div>
        </>
      ) : null}
    </nav>
  );
}
