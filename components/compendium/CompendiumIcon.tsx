"use client";

import type { CompendiumEntry } from "@/lib/compendium/types";
import {
  compendiumIconLabel,
  compendiumImageUrl,
  compendiumTypeColor,
  resolveCompendiumIconKind,
  type CompendiumIconKind,
} from "@/lib/compendium/icons";

type EntryLike = Pick<CompendiumEntry, "id" | "name" | "type" | "img" | "system">;

type Props = {
  entry: EntryLike;
  color?: string;
  className?: string;
  /** Mostra inicial se não houver imagem (raro). */
  fallbackLetter?: string;
};

const SVG_PATHS: Record<CompendiumIconKind, string> = {
  "weapon-sword":
    "M12 2l2 2-7 7 1 5 5 1 7-7 2 2-9 9-6-1-1-6z M14 4l6 6",
  "weapon-bow": "M6 4c4 4 4 12 0 16 M18 4c-4 4-4 12 0 16 M12 6v12",
  "weapon-crossbow": "M4 12h16 M12 6v12 M8 8l8 8 M16 8l-8 8",
  "weapon-spear": "M12 3v15 M9 18h6 M8 6l4-3 4 3",
  "weapon-axe": "M6 18l4-10 8-2-2 8-10 4z M14 6l4 4",
  "weapon-dagger": "M12 3l-2 14h4z M10 19h4",
  "weapon-hammer": "M8 10h8v4H8z M10 14v6h4v-6 M14 6h4v6h-4z",
  "weapon-organic": "M8 18c0-5 2-9 4-12 2 3 4 7 4 12z M16 18c0-4-1-7-3-10 2 3 3 6 3 10z",
  "weapon-generic": "M7 17l5-12 5 12z M9 13h6",
  "ability-move": "M5 12h10 M11 8l4 4-4 4 M17 6v12",
  "ability-attack": "M6 18l4-10 6-2-2 6-8 6z",
  "ability-defend": "M12 3l8 4v6c0 5-4 8-8 8s-8-3-8-8V7z",
  "ability-utility": "M12 2a10 10 0 100 20 10 10 0 000-20z M12 8v4l3 2",
  "spell-fire": "M12 3c2 4 5 6 5 10a5 5 0 11-10 0c0-4 3-6 5-10z",
  "spell-frost": "M12 3v18 M6 7l12 10 M18 7L6 17 M4 12h16",
  "spell-nature": "M12 20V8 M8 12c0-4 2-7 4-8 2 1 4 4 4 8z M16 12c0-4-2-7-4-8-2 1-4 4-4 8z",
  "spell-arcane": "M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z",
  "spell-holy": "M12 4v16 M8 8h8 M6 12h12",
  "spell-shadow": "M9 11a3 3 0 106 0 5 5 0 10-6 0z M7 18c2-3 8-3 10 0",
  "spell-generic": "M12 2a10 10 0 100 20 10 10 0 000-20z",
  "equip-armor": "M12 3l7 3v7c0 5-3 8-7 8s-7-3-7-8V6z",
  "equip-potion": "M9 4h6v3H9z M8 7h8v3c0 5-2 10-4 10s-4-5-4-10V7z",
  "equip-ammo": "M12 3v14 M9 19h6 M10 7h4",
  "equip-tool": "M14 6l4 4-8 8H6v-4z M16 4l2 2",
  "equip-generic": "M6 8h12v10H6z M9 8V6h6v2",
  "monster-undead": "M9 10h6v8H9z M10 7h4v3h-4z M8 18h8",
  "monster-dragon": "M5 14c3-6 11-8 14-2 1 3-1 6-4 6H8l-3 2z M16 8l3-2",
  "monster-beast": "M6 14c2-5 10-5 12 0 1 3-2 6-6 6s-7-3-6-6z M9 10h1 M14 10h1",
  "monster-construct": "M8 8h8v10H8z M10 5h4v3h-4z M10 18h4",
  "monster-humanoid": "M12 5a3 3 0 110 6 3 3 0 010-6z M8 20v-5h8v5",
  "monster-generic": "M7 13c1-4 4-6 5-9 1 3 4 5 5 9 0 3-3 5-5 5s-5-2-5-5z",
  effect: "M12 2v6l4 2-6 12-6-12 4-2V2z",
  fallback: "M8 8h8v8H8z",
};

export function CompendiumIcon({ entry, color, className, fallbackLetter }: Props) {
  const tint = color ?? compendiumTypeColor(entry.type);
  const imgUrl = compendiumImageUrl(entry);
  const kind = resolveCompendiumIconKind(entry);
  const label = compendiumIconLabel(kind);
  const letter = fallbackLetter ?? (entry.name.trim().charAt(0).toUpperCase() || "?");

  const rootClass = ["comp-icon-art", className].filter(Boolean).join(" ");

  if (imgUrl) {
    return (
      <span className={rootClass} style={{ background: `${tint}22`, color: tint }} title={label}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgUrl} alt="" />
      </span>
    );
  }

  return (
    <span className={rootClass} style={{ background: `${tint}22`, color: tint }} title={label} aria-label={label}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={SVG_PATHS[kind]} />
      </svg>
      <span className="comp-icon-art__letter" aria-hidden>
        {letter}
      </span>
    </span>
  );
}
