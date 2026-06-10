"use client";

import { useMemo, useState } from "react";
import { MonsterCompendiumSheet } from "@/components/compendium/MonsterCompendiumSheet";
import { FoundryWindow } from "@/components/vtt/foundry/FoundryWindow";
import type { FoundryWindowLayout } from "@/hooks/vtt/useFoundryWindows";
import { getMonsterTemplate, listMonsterTemplates } from "@/lib/vtt/monsters";
import "./monster-sheet.css";

type Props = {
  entryId: string;
  onEntryChange: (entryId: string) => void;
  layout: FoundryWindowLayout;
  onLayoutChange: (patch: Partial<FoundryWindowLayout>) => void;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
};

function normalizeQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function MonsterSheetPopup({
  entryId,
  onEntryChange,
  layout,
  onLayoutChange,
  onFocus,
  onMinimize,
  onClose,
}: Props) {
  const monsters = useMemo(() => listMonsterTemplates(), []);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalizeQuery(query);
    if (!q) return monsters;
    return monsters.filter((m) => {
      const name = normalizeQuery(m.name);
      const id = m.entryId.toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [monsters, query]);

  const options = useMemo(() => {
    if (filtered.some((m) => m.entryId === entryId)) return filtered;
    const current = monsters.find((m) => m.entryId === entryId);
    return current ? [current, ...filtered] : filtered;
  }, [filtered, monsters, entryId]);

  const template = getMonsterTemplate(entryId);
  const title = template ? `Ficha — ${template.name}` : "Ficha do monstro";

  return (
    <FoundryWindow
      title={title}
      layout={layout}
      onLayoutChange={onLayoutChange}
      onClose={onClose}
      onMinimize={onMinimize}
      onFocus={onFocus}
      className="foundry-window--monster-sheet"
      minWidth={380}
      minHeight={360}
    >
      <div className="monster-sheet-popup">
        <div className="monster-sheet-popup__picker">
          <label className="monster-sheet-popup__search">
            <span className="sr-only">Buscar monstro</span>
            <input
              type="search"
              className="vtt-input"
              placeholder="Buscar monstro…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="monster-sheet-popup__select">
            <span className="sr-only">Selecionar monstro</span>
            <select
              className="vtt-input"
              value={entryId}
              onChange={(e) => onEntryChange(e.target.value)}
            >
              {options.length === 0 ? (
                <option value="">Nenhum resultado</option>
              ) : (
                options.map((m) => (
                  <option key={m.entryId} value={m.entryId}>
                    {m.name} · ameaça {m.ameaca}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>
        <div className="monster-sheet-popup__body">
          <MonsterCompendiumSheet entryId={entryId} variant="popup" />
        </div>
      </div>
    </FoundryWindow>
  );
}
