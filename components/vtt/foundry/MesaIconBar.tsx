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
  /** Clique direito — painel na barra lateral. */
  onOpenDock: (id: MesaWindowId) => void;
  /** Clique esquerdo — janela flutuante. */
  onOpenPopup: (id: MesaWindowId) => void;
  showGm?: boolean;
  showInvite?: boolean;
};

function IconButton({
  icon,
  active,
  onOpenDock,
  onOpenPopup,
  gm,
}: {
  icon: IconDef;
  active: boolean;
  onOpenDock: (id: MesaWindowId) => void;
  onOpenPopup: (id: MesaWindowId) => void;
  gm?: boolean;
}) {
  return (
    <button
      type="button"
      className={`foundry-icon-bar__btn${active ? " foundry-icon-bar__btn--active" : ""}${gm ? " foundry-icon-bar__btn--gm" : ""}`}
      onClick={() => onOpenPopup(icon.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onOpenDock(icon.id);
      }}
      title={`${icon.label} — clique: abrir/fechar · clique direito: barra lateral`}
      aria-label={icon.label}
      aria-pressed={active}
    >
      <span className="foundry-icon-bar__icon-wrap" aria-hidden>
        <MesaRailIcon name={icon.icon} />
      </span>
      <span className="foundry-icon-bar__label">{icon.label}</span>
    </button>
  );
}

export function MesaIconBar({
  isActive,
  onOpenDock,
  onOpenPopup,
  showGm = false,
  showInvite = false,
}: Props) {
  const icons: IconDef[] = [
    { id: "status", label: "Status", icon: "status", section: "play" },
    { id: "actors", label: "Tokens", icon: "actors", section: "play" },
    { id: "initiative", label: "Turno", icon: "initiative", section: "play" },
    { id: "ficha", label: "Ficha", icon: "ficha", section: "play" },
    { id: "chat", label: "Chat", icon: "chat", section: "play" },
    { id: "dice", label: "Dados", icon: "dice", section: "play" },
    { id: "whiteboard", label: "Lousa", icon: "whiteboard", section: "play" },
    { id: "invite", label: "Convite", icon: "invite", section: "play", show: showInvite },
    { id: "dungeon", label: "Mapa", icon: "dungeon", section: "gm", show: showGm },
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
            onOpenDock={onOpenDock}
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
                onOpenDock={onOpenDock}
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
