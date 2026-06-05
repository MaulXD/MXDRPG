import type { CreatureSize } from "@/lib/vtt/creature-size";
import monsterTamanhos from "@/data/monster-tamanhos.json";
import type { MonsterSpawnVariant } from "@/lib/vtt/monster-scaling";

/** Tamanho VTT por entryId — alinhado a D&D 5e / SRD e nomes do bestiário Eldarin. */
export const MONSTER_SIZE_BY_ENTRY_ID = monsterTamanhos as Record<string, CreatureSize>;

export const CREATURE_SIZE_PT: Record<CreatureSize, string> = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
  huge: "Gigante",
  gargantuan: "Imenso",
  colossal: "Colossal",
};

/** Hexes ocupados (referência rápida para o livro). */
export const CREATURE_SIZE_HEX_LABEL: Record<CreatureSize, string> = {
  small: "1 hex",
  medium: "1 hex",
  large: "3 hex",
  huge: "7 hex",
  gargantuan: "19 hex",
  colossal: "37 hex",
};

const VALID_SIZES = new Set<string>([
  "small",
  "medium",
  "large",
  "huge",
  "gargantuan",
  "colossal",
]);

export function parseCreatureSize(raw: string | undefined | null): CreatureSize | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  if (VALID_SIZES.has(key)) return key as CreatureSize;
  const map: Record<string, CreatureSize> = {
    pequeno: "small",
    médio: "medium",
    medio: "medium",
    grande: "large",
    gigante: "huge",
    enorme: "huge",
    imenso: "gargantuan",
    colossal: "colossal",
  };
  return map[key] ?? null;
}

export function resolveMonsterCreatureSize(
  entryId: string,
  name: string,
  opts?: { walk?: number; tier?: string; variant?: MonsterSpawnVariant }
): CreatureSize {
  const mapped = MONSTER_SIZE_BY_ENTRY_ID[entryId];
  if (mapped) return mapped;

  const lower = name.toLowerCase();
  if (lower.includes("colossal") || opts?.variant === "colossal") return "colossal";
  if (lower.includes("behemoth") || lower.includes("kraken") || lower.includes("dragão ancião") || lower.includes("dragao anciao")) {
    return "gargantuan";
  }
  if (
    lower.includes("verme gigante") ||
    lower.includes("hidra") ||
    lower.includes("ciclope") ||
    lower.includes("dragão jovem") ||
    lower.includes("dragao jovem") ||
    lower.includes("escorpião gigante") ||
    lower.includes("escorpiao gigante") ||
    lower.includes("planta carnívora gigante") ||
    lower.includes("planta carnivora gigante") ||
    lower.includes("treant") ||
    lower.includes("cogumelo-rei")
  ) {
    return "huge";
  }
  if (
    lower.includes("minotauro") ||
    lower.includes("golem") ||
    lower.includes("wyvern") ||
    lower.includes("grifo") ||
    lower.includes("manticora") ||
    lower.includes("basilisco") ||
    lower.includes("elemental")
  ) {
    return "large";
  }
  if (
    (lower.includes("goblin") || opts?.tier === "mob") &&
    (opts?.walk ?? 99) <= 4 &&
    (lower.includes("goblin") || (opts?.walk ?? 0) <= 3)
  ) {
    return "small";
  }
  return "medium";
}
