/** Glifos e cores para cartas de religião no wizard/ficha. */

export type ReligionIconKind =
  | "forge"
  | "abyss"
  | "eye"
  | "tide"
  | "torch"
  | "shield"
  | "veil"
  | "flame"
  | "knife"
  | "swarm"
  | "cauldron"
  | "secular";

const RELIGION_ICON: Record<string, ReligionIconKind> = {
  valdrun: "forge",
  mira: "abyss",
  sorn: "eye",
  thalor: "tide",
  vesna: "torch",
  korrath: "shield",
  luneth: "veil",
  "brasa-reinante": "flame",
  "faca-sem-nome": "knife",
  enxame: "swarm",
  "primeiro-cozinheiro": "cauldron",
  "sem-deus": "secular",
};

const RELIGION_COLOR: Record<string, string> = {
  valdrun: "#e8a045",
  mira: "#5ec4a0",
  sorn: "#8b9cb8",
  thalor: "#4a9fd4",
  vesna: "#f0e6c8",
  korrath: "#9a8b7a",
  luneth: "#b8a8e8",
  "brasa-reinante": "#e85c3a",
  "faca-sem-nome": "#4a4a52",
  enxame: "#8bc34a",
  "primeiro-cozinheiro": "#d4a574",
  "sem-deus": "#94a3be",
};

const GLYPH: Record<ReligionIconKind, string> = {
  forge: "⚒",
  abyss: "◈",
  eye: "◎",
  tide: "⚓",
  torch: "✦",
  shield: "⛨",
  veil: "☽",
  flame: "🔥",
  knife: "†",
  swarm: "⁂",
  cauldron: "⚗",
  secular: "○",
};

export function resolveReligionIcon(id: string): ReligionIconKind {
  return RELIGION_ICON[id] ?? "secular";
}

export function religionIconColor(id: string): string {
  return RELIGION_COLOR[id] ?? "#94a3be";
}

export function religionGlyph(id: string): string {
  return GLYPH[resolveReligionIcon(id)];
}
