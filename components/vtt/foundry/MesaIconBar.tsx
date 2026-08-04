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
  /** Ferramentas de Mestre do Um Anel (Jornada, Conselho) — só em mesa do sistema. */
  showTorGmTools?: boolean;
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
      data-rail-icon={icon.icon}
      className={`foundry-icon-bar__btn${active ? " foundry-icon-bar__btn--active" : ""}${gm ? " foundry-icon-bar__btn--gm" : ""}`}
      onClick={() => onOpenDock(icon.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onOpenPopup(icon.id);
      }}
      aria-label={`${icon.label} — clique: barra lateral · clique direito: janela flutuante`}
      aria-pressed={active}
    >
      <span className="foundry-icon-bar__icon-wrap" data-rail-icon={icon.icon} aria-hidden>
        <MesaRailIcon name={icon.icon} />
      </span>
      <span className="foundry-icon-bar__label" aria-hidden>{icon.label}</span>
      <span className="foundry-icon-bar__tooltip" role="tooltip">
        <span className="foundry-icon-bar__tooltip-title">{icon.label}</span>
        <span className="foundry-icon-bar__tooltip-hint">
          Clique: barra · direito: janela
        </span>
      </span>
    </button>
  );
}

export function MesaIconBar({
  isActive,
  onOpenDock,
  onOpenPopup,
  showGm = false,
  showInvite = false,
  showTorGmTools = false,
}: Props) {
  const icons: IconDef[] = [
    { id: "status", label: "Status", icon: "status", section: "play" },
    { id: "initiative", label: "Turno", icon: "initiative", section: "play" },
    { id: "ficha", label: "Ficha", icon: "ficha", section: "play" },
    { id: "chat", label: "Chat", icon: "chat", section: "play" },
    { id: "dice", label: "Dados", icon: "dice", section: "play" },
    { id: "compendium", label: "Compêndio", icon: "compendium", section: "play" },
    // Jornada é conduzida pelo Mestre e só existe em mesa do Um Anel.
    { id: "torJourney", label: "Jornada", icon: "torJourney", section: "gm", show: showTorGmTools },
    { id: "torCouncil", label: "Conselho", icon: "torCouncil", section: "gm", show: showTorGmTools },
    { id: "invite", label: "Convite", icon: "invite", section: "play", show: showInvite },
    { id: "dungeon", label: "Mapa", icon: "dungeon", section: "gm", show: showGm },
    { id: "gm", label: "Mestre", icon: "gm", section: "gm", show: showGm },
    { id: "spawn", label: "Invocar", icon: "spawn", section: "gm", show: showGm },
  ];

  const playIcons = icons.filter((i) => i.section === "play" && i.show !== false);
  const gmIcons = icons.filter((i) => i.section === "gm" && i.show !== false);

  return (
    <nav className="foundry-icon-bar" aria-label="Atalhos dos painéis">
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
