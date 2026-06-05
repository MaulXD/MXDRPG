"use client";

import type { ReactNode } from "react";
import type { MesaWindowId } from "@/hooks/vtt/useFoundryWindows";
import { MesaIconBar } from "@/components/vtt/foundry/MesaIconBar";

type Props = {
  isActive: (id: MesaWindowId) => boolean;
  onToggle: (id: MesaWindowId) => void;
  onOpenPopup?: (id: MesaWindowId) => void;
  showGm?: boolean;
  dockOpen: boolean;
  children: ReactNode;
};

export function MesaFoundrySidebar({
  isActive,
  onToggle,
  onOpenPopup,
  showGm = false,
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
        onToggle={onToggle}
        onOpenPopup={onOpenPopup}
        showGm={showGm}
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
