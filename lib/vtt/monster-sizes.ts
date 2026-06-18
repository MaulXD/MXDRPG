import type { CreatureSize } from "@/lib/vtt/creature-size";
import monsterTamanhos from "@/data/monster-tamanhos.json";
import type { MonsterSpawnVariant } from "@/lib/vtt/monster-scaling";

/** Tamanho VTT por entryId — alinhado a fantasia tática / tabela de referência e nomes do bestiário Eldarin. */
export const MONSTER_SIZE_BY_ENTRY_ID = monsterTamanhos as Record<string, CreatureSize>;

export const CREATURE_SIZE_PT: Record<CreatureSize, string> = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
  huge: "Gigante",
  gargantuan: "Imenso",
  colossal: "Colossal",
};

/** @deprecated Use CREATURE_SIZE_GRID_LABEL */
export const CREATURE_SIZE_CELL_LABEL: Record<CreatureSize, string> = {
  small: "1 célula",
  medium: "1 célula",
  large: "2×2 (4 células)",
  huge: "3×3 (9 células)",
  gargantuan: "4×4 (16 células)",
  colossal: "5×5 (25 células)",
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
  if (
    lower.includes("behemoth") ||
    lower.includes("kraken") ||
    lower.includes("dragão ancião") ||
    lower.includes("dragao anciao") ||
    lower.includes("devorador ancião") ||
    lower.includes("devorador anciao")
  ) {
    return "gargantuan";
  }
  if (
    lower.includes("verme gigante") ||
    lower.includes("hidra") ||
    lower.includes("ciclope") ||
    lower.includes("treant") ||
    lower.includes("cogumelo-rei") ||
    lower.includes("gigante de pedra") ||
    lower.includes("morcego-tirano") ||
    lower.includes("tubarao") ||
    lower.includes("tubarão") ||
    lower.includes("serpente-do-abismo")
  ) {
    return "huge";
  }
  if (
    lower.includes("dragão jovem") ||
    lower.includes("dragao jovem") ||
    lower.includes("minotauro") ||
    lower.includes("golem") ||
    lower.includes("wyvern") ||
    lower.includes("grifo") ||
    lower.includes("manticora") ||
    lower.includes("elemental") ||
    lower.includes("arquidemônio") ||
    lower.includes("escorpião gigante") ||
    lower.includes("escorpiao gigante")
  ) {
    return "large";
  }
  if (
    lower.includes("basilisco") ||
    lower.includes("cocatriz") ||
    lower.includes("besouro-diamante") ||
    lower.includes("besouro diamante")
  ) {
    return lower.includes("basilisco") ? "medium" : "small";
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
