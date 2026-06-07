import type { AttributeKey, ClassId, CulinaryKey } from "@/lib/character/rules";
import { ATTRIBUTE_LABELS, getClass } from "@/lib/character/rules";

const ATTR_ORDER: AttributeKey[] = [
  "forca",
  "destreza",
  "constituicao",
  "inteligencia",
  "sabedoria",
  "carisma",
];

const PRIMARY_TOKEN_TO_ATTR: Record<string, AttributeKey> = {
  força: "forca",
  forca: "forca",
  destreza: "destreza",
  constituição: "constituicao",
  constituicao: "constituicao",
  inteligência: "inteligencia",
  inteligencia: "inteligencia",
  sabedoria: "sabedoria",
  carisma: "carisma",
};

export const CULINARY_KEYS: CulinaryKey[] = [
  "trinchar",
  "harmonizacao",
  "coccao",
  "estomagoDeFerro",
];

export const CULINARY_LABELS: Record<CulinaryKey, string> = {
  trinchar: "Extração",
  harmonizacao: "Forrageio",
  coccao: "Fabricação",
  estomagoDeFerro: "Fortitude",
};

/** Converte `primary` da ficha de classe — ex. `Destreza e Sabedoria`. */
export function parsePrimaryAttributes(primary: string): AttributeKey[] {
  const normalized = primary
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  const chunks = normalized.split(/\s+(?:ou|e)\s+/);
  const out: AttributeKey[] = [];

  for (const chunk of chunks) {
    for (const [token, attr] of Object.entries(PRIMARY_TOKEN_TO_ATTR)) {
      const tokenNorm = token.normalize("NFD").replace(/\p{M}/gu, "");
      if (chunk.includes(tokenNorm)) {
        if (!out.includes(attr)) out.push(attr);
        break;
      }
    }
  }

  return out;
}

/**
 * Foco de atributos por classe (Cap. 4 + HP/CA do Cap. 2).
 * Ordem = prioridade na sugestão de point-buy (27 pts).
 */
const CLASS_ATTRIBUTE_FOCUS: Partial<Record<ClassId, AttributeKey[]>> = {
  Guerreiro: ["forca", "constituicao", "destreza"],
  Patrulheiro: ["destreza", "sabedoria", "constituicao"],
  Ladino: ["destreza", "constituicao", "inteligencia"],
  Mago: ["inteligencia", "constituicao", "destreza"],
  Clérigo: ["sabedoria", "carisma", "constituicao"],
  Bárbaro: ["forca", "constituicao", "destreza"],
  Bardo: ["carisma", "destreza", "constituicao"],
  Druida: ["sabedoria", "constituicao", "destreza"],
  Artífice: ["inteligencia", "destreza", "constituicao"],
  Paladino: ["forca", "constituicao", "carisma"],
  Bruxo: ["carisma", "constituicao", "destreza"],
};

/** Prioridade de compra de pontos — foco explícito da classe ou fallback do texto `primary`. */
export function classAttributePriority(classId: string): AttributeKey[] {
  const explicit = CLASS_ATTRIBUTE_FOCUS[classId as ClassId];
  if (explicit?.length) {
    const seen = new Set<AttributeKey>();
    const ordered: AttributeKey[] = [];
    for (const key of [...explicit, ...ATTR_ORDER]) {
      if (seen.has(key)) continue;
      seen.add(key);
      ordered.push(key);
    }
    return ordered;
  }

  const cls = getClass(classId);
  const primaries = cls ? parsePrimaryAttributes(cls.primary) : [];
  const tail: AttributeKey[] = [];
  if (!primaries.includes("constituicao")) tail.push("constituicao");
  const remaining = ATTR_ORDER.filter((a) => !primaries.includes(a) && !tail.includes(a));
  return [...primaries, ...tail, ...remaining];
}

/** Posição do atributo no foco da classe (1 = principal). `null` se fora do top 3. */
export function classAttributeFocusRank(classId: string, key: AttributeKey): number | null {
  const idx = classAttributePriority(classId).indexOf(key);
  if (idx < 0 || idx > 2) return null;
  return idx + 1;
}

/** Resumo legível do foco (ex. "Força · Constituição · Carisma"). */
export function classAttributeFocusSummary(classId: string, top = 3): string {
  return classAttributePriority(classId)
    .slice(0, top)
    .map((k) => ATTRIBUTE_LABELS[k])
    .join(" · ");
}

/**
 * Ciclo ponderado pelos valores iniciais de culinária da classe.
 * Ex.: Bardo (Forrageio +5, Coccao +2) → 5 entradas de harmonizacao, 2 de coccao.
 */
export function culinaryScaleCycle(classId: string): CulinaryKey[] {
  const cls = getClass(classId);
  const cycle: CulinaryKey[] = [];

  for (const key of CULINARY_KEYS) {
    const weight = cls?.culinary[key] ?? 0;
    for (let i = 0; i < weight; i++) cycle.push(key);
  }

  return cycle.length ? cycle : [...CULINARY_KEYS];
}

/** Qual atributo culinário sobe neste nível, respeitando a escala da classe. */
export function culinarySkillForLevel(classId: string, level: number): CulinaryKey {
  const cycle = culinaryScaleCycle(classId);
  const idx = Math.max(0, level - 1) % cycle.length;
  return cycle[idx]!;
}

export function culinaryLabel(key: CulinaryKey): string {
  return CULINARY_LABELS[key];
}

/** Resumo legível da escala culinária inicial (para tooltips / revisão). */
export function formatClassCulinaryScale(classId: ClassId | string): string {
  const cls = getClass(classId);
  if (!cls) return "";
  return CULINARY_KEYS.filter((k) => (cls.culinary[k] ?? 0) > 0)
    .map((k) => `${CULINARY_LABELS[k]} +${cls.culinary[k]}`)
    .join(" · ");
}
