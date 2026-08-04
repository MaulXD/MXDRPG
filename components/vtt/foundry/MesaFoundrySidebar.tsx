"use client";

import type { ReactNode } from "react";
import type { MesaWindowId } from "@/hooks/vtt/useFoundryWindows";
import { MesaIconBar } from "@/components/vtt/foundry/MesaIconBar";

type Props = {
  isActive: (id: MesaWindowId) => boolean;
  onOpenDock: (id: MesaWindowId) => void;
  onOpenPopup: (id: MesaWindowId) => void;
  showGm?: boolean;
  showInvite?: boolean;
  showTorGmTools?: boolean;
  dockOpen: boolean;
  children: ReactNode;
};

export function MesaFoundrySidebar({
  isActive,
  onOpenDock,
  onOpenPopup,
  showGm = false,
  showInvite = false,
  showTorGmTools = false,
  dockOpen,
  children,
}: Props) {
  return (
    <aside
      className={`foundry-sidebar${dockOpen ? " foundry-sidebar--dock-open" : ""}`}
      aria-label="Painéis da mesa"
    >
      <MesaIconBar
        isActive={isActive}
        onOpenDock={onOpenDock}
        onOpenPopup={onOpenPopup}
        showGm={showGm}
        showInvite={showInvite}
        showTorGmTools={showTorGmTools}
      />
      <div
        id="foundry-sidebar-dock"
        className={`foundry-sidebar__dock${dockOpen ? "" : " foundry-sidebar__dock--collapsed"}`}
      >
        {children}
      </div>
    </aside>
  );
}
