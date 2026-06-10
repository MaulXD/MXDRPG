import type { CompendiumEntry, ItemType } from "@/lib/compendium/types";

/** Cores v5 — docs/DESIGN-ELDARIN-V5-CORES.md (border-left / ícone, não background) */
export const COMPENDIUM_TYPE_COLOR: Record<string, string> = {
  arma: "#8b3a22",
  habilidade: "#6e4800",
  magia: "#6e3a52",
  equipamento: "#4a3820",
  efeito: "#2a4a2c",
  npc: "#5e1a0e",
  character: "#5e1a0e",
};

export type CompendiumIconKind =
  | "weapon-sword"
  | "weapon-bow"
  | "weapon-crossbow"
  | "weapon-spear"
  | "weapon-axe"
  | "weapon-dagger"
  | "weapon-hammer"
  | "weapon-organic"
  | "weapon-generic"
  | "ability-move"
  | "ability-attack"
  | "ability-defend"
  | "ability-utility"
  | "spell-fire"
  | "spell-frost"
  | "spell-nature"
  | "spell-arcane"
  | "spell-holy"
  | "spell-shadow"
  | "spell-generic"
  | "equip-armor"
  | "equip-potion"
  | "equip-ammo"
  | "equip-tool"
  | "equip-generic"
  | "monster-undead"
  | "monster-dragon"
  | "monster-beast"
  | "monster-construct"
  | "monster-humanoid"
  | "monster-generic"
  | "effect"
  | "fallback";

type EntryLike = Pick<CompendiumEntry, "id" | "name" | "type" | "img" | "system">;

function catalogId(entry: EntryLike): string {
  return String(entry.system.catalogId ?? "").toUpperCase();
}

function haystack(entry: EntryLike): string {
  return `${entry.id} ${entry.name} ${catalogId(entry)}`.toLowerCase();
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function weaponKind(entry: EntryLike): CompendiumIconKind {
  const cid = catalogId(entry);
  const text = haystack(entry);

  if (cid.startsWith("ARC-") || hasAny(text, ["arco", "bow"])) return "weapon-bow";
  if (cid.startsWith("BST-") || hasAny(text, ["besta", "crossbow"])) return "weapon-crossbow";
  if (cid.startsWith("WPN-S") || cid.startsWith("ESP-") || hasAny(text, ["espada", "lâmina", "lamina", "sabre"]))
    return "weapon-sword";
  if (cid.startsWith("WPN-P") || cid.startsWith("LAN-") || hasAny(text, ["lança", "lanca", "haste", "spear"]))
    return "weapon-spear";
  if (cid.startsWith("ORG-") || hasAny(text, ["orgân", "organ", "mandíbula", "mandibula", "chifre", "presa"]))
    return "weapon-organic";
  if (hasAny(text, ["adaga", "punhal", "dagger"])) return "weapon-dagger";
  if (hasAny(text, ["machado", "axe", "cutelo"])) return "weapon-axe";
  if (hasAny(text, ["martelo", "malho", "maça", "maca", "hammer", "clava"])) return "weapon-hammer";
  return "weapon-generic";
}

function abilityKind(entry: EntryLike): CompendiumIconKind {
  const text = haystack(entry);
  if (hasAny(text, ["investida", "desloca", "movimento", "corrida", "salto", "dash", "esquiva"]))
    return "ability-move";
  if (hasAny(text, ["escudo", "defesa", "bloqueio", "resist", "proteção", "protecao", "parry"]))
    return "ability-defend";
  if (hasAny(text, ["golpe", "ataque", "strike", "corte", "impacto", "flanque"])) return "ability-attack";
  return "ability-utility";
}

function spellKind(entry: EntryLike): CompendiumIconKind {
  const spell = entry.system.spell as { escola?: string } | undefined;
  const school = (spell?.escola ?? "").toLowerCase();
  const text = haystack(entry);

  if (hasAny(text, ["gelo", "frio", "congel", "frost"])) return "spell-frost";
  if (hasAny(text, ["fogo", "chama", "calor", "brasas", "fire"])) return "spell-fire";
  if (hasAny(text, ["veneno", "podrid", "necro", "morte", "sombra", "fantasma"])) return "spell-shadow";
  if (hasAny(text, ["cura", "luz", "benção", "bencao", "sagrado"])) return "spell-holy";
  if (hasAny(text, ["planta", "vinha", "raiz", "natureza", "floresta"])) return "spell-nature";

  if (school.includes("evoca")) return "spell-fire";
  if (school.includes("necrom")) return "spell-shadow";
  if (school.includes("abjur") || school.includes("encant")) return "spell-holy";
  if (school.includes("conjur") || school.includes("transmut")) return "spell-nature";
  if (school.includes("ilus") || school.includes("divin")) return "spell-arcane";
  return "spell-generic";
}

function equipKind(entry: EntryLike): CompendiumIconKind {
  const cid = catalogId(entry);
  const text = haystack(entry);

  if (cid.startsWith("ARM-") || hasAny(text, ["armadura", "peitoral", "elmo", "escudo pesado"]))
    return "equip-armor";
  if (cid.startsWith("POC-") || hasAny(text, ["poção", "pocao", "elixir", "frasco"])) return "equip-potion";
  if (cid.startsWith("MUN-") || hasAny(text, ["flecha", "virote", "munição", "municao", "bolt"]))
    return "equip-ammo";
  if (hasAny(text, ["kit", "forja", "ferramenta", "trinchar", "suprimento"])) return "equip-tool";
  return "equip-generic";
}

function monsterKind(entry: EntryLike): CompendiumIconKind {
  const text = haystack(entry);

  if (
    hasAny(text, [
      "zumbi",
      "esqueleto",
      "ghoul",
      "lich",
      "vampiro",
      "espectro",
      "múmia",
      "mumia",
      "assombra",
      "morto",
      "necro",
    ])
  )
    return "monster-undead";
  if (hasAny(text, ["dragão", "dragao", "wyvern", "drake", "dragonete"])) return "monster-dragon";
  if (hasAny(text, ["golem", "armadura animada", "autômato", "autômato", "autómato", "constructo"]))
    return "monster-construct";
  if (hasAny(text, ["goblin", "orc", "hobgoblin", "minotauro", "troll humanoide", "bandido"]))
    return "monster-humanoid";
  if (hasAny(text, ["aranha", "grifo", "basilisco", "manticora", "serpente", "lobo", "urso", "escorpião", "escorpiao"]))
    return "monster-beast";
  return "monster-generic";
}

export function resolveCompendiumIconKind(entry: EntryLike): CompendiumIconKind {
  const type = entry.type as ItemType | "npc" | "character";

  switch (type) {
    case "arma":
      return weaponKind(entry);
    case "habilidade":
      return abilityKind(entry);
    case "magia":
      return spellKind(entry);
    case "equipamento":
      return equipKind(entry);
    case "efeito":
      return "effect";
    case "npc":
      return monsterKind(entry);
    default:
      return "fallback";
  }
}

export function compendiumTypeColor(type: string): string {
  return COMPENDIUM_TYPE_COLOR[type] ?? "#4a3820";
}

/** URL de imagem explícita no JSON (`img`) ou caminho absoluto. */
export function compendiumImageUrl(entry: EntryLike): string | null {
  const img = entry.img?.trim();
  if (!img) return null;
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/")) return img;
  return null;
}

export function compendiumIconLabel(kind: CompendiumIconKind): string {
  const labels: Record<CompendiumIconKind, string> = {
    "weapon-sword": "Espada",
    "weapon-bow": "Arco",
    "weapon-crossbow": "Besta",
    "weapon-spear": "Lança",
    "weapon-axe": "Machado",
    "weapon-dagger": "Adaga",
    "weapon-hammer": "Martelo",
    "weapon-organic": "Arma orgânica",
    "weapon-generic": "Arma",
    "ability-move": "Movimento",
    "ability-attack": "Ataque",
    "ability-defend": "Defesa",
    "ability-utility": "Habilidade",
    "spell-fire": "Magia de fogo",
    "spell-frost": "Magia de gelo",
    "spell-nature": "Magia natural",
    "spell-arcane": "Magia arcana",
    "spell-holy": "Magia sagrada",
    "spell-shadow": "Magia sombria",
    "spell-generic": "Magia",
    "equip-armor": "Armadura",
    "equip-potion": "Poção",
    "equip-ammo": "Munição",
    "equip-tool": "Ferramenta",
    "equip-generic": "Equipamento",
    "monster-undead": "Morto-vivo",
    "monster-dragon": "Dragão",
    "monster-beast": "Fera",
    "monster-construct": "Constructo",
    "monster-humanoid": "Humanóide",
    "monster-generic": "Monstro",
    effect: "Efeito",
    fallback: "Item",
  };
  return labels[kind];
}
