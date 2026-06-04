"use client";

import type { ReactNode } from "react";

export type MesaRailTab = "chat" | "dice" | "sheet" | "spawn";

type TabDef = {
  id: MesaRailTab;
  label: string;
  show?: boolean;
};

type Props = {
  tab: MesaRailTab;
  onTabChange: (tab: MesaRailTab) => void;
  showSpawn?: boolean;
  children: ReactNode;
};

export function MesaSideRail({ tab, onTabChange, showSpawn, children }: Props) {
  const tabs: TabDef[] = [
    { id: "chat", label: "Chat" },
    { id: "dice", label: "Dados" },
    { id: "sheet", label: "Ficha" },
    { id: "spawn", label: "Invocar", show: showSpawn },
  ];

  return (
    <aside className="mesa-rail" aria-label="Painel da mesa">
      <div className="mesa-rail-tabs" role="tablist">
        {tabs
          .filter((t) => t.show !== false)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`mesa-rail-tab${tab === t.id ? " active" : ""}`}
              onClick={() => onTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
      </div>
      <div className="mesa-rail-panel" role="tabpanel">
        {children}
      </div>
    </aside>
  );
}
