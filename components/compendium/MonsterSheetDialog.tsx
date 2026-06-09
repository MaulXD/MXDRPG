"use client";

import { useEffect } from "react";
import { MonsterCompendiumSheet } from "@/components/compendium/MonsterCompendiumSheet";

type Props = {
  entryId: string | null;
  onClose: () => void;
};

export function MonsterSheetDialog({ entryId, onClose }: Props) {
  useEffect(() => {
    if (!entryId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [entryId, onClose]);

  if (!entryId) return null;

  return (
    <div
      className="monster-sheet-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="monster-sheet-dialog glass-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Ficha do monstro"
        onClick={(e) => e.stopPropagation()}
      >
        <MonsterCompendiumSheet entryId={entryId} onClose={onClose} variant="dialog" />
      </div>
    </div>
  );
}
