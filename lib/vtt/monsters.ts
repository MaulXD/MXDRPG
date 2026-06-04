import monstrosData from "@/data/compendiums/monstros.json";
import { slugId } from "@/lib/compendium/format";
import type { CompendiumEntryRaw } from "@/lib/compendium/types";
import type { Axial } from "@/lib/vtt/hex-math";
import { defaultMovementFields } from "@/lib/vtt/movement";
import type { CombatActionOption } from "@/lib/combat/types";
import type { BattleToken } from "@/lib/vtt/types";
import { MONSTER_PA_MIN, normalizeMonsterPa } from "@/lib/vtt/monster-pa";
import {
  applyMonsterSpawnScaling,
  type MonsterSpawnOptions,
  type MonsterSpawnVariant,
} from "@/lib/vtt/monster-scaling";

export { MONSTER_PA_MIN, normalizeMonsterPa } from "@/lib/vtt/monster-pa";

export type MonsterTier = "mob" | "mini" | "boss";
export type { MonsterSpawnVariant, MonsterSpawnOptions };

export type MonsterTemplate = {
  entryId: string;
  name: string;
  description: string;
  tier: MonsterTier;
  vida: number;
  vidaMax: number;
  pa: number;
  paMax: number;
  defesa: number;
  walk: number;
  run: number;
  ameaca: number;
  forca: number;
  agilidade: number;
  actions: CombatActionOption[];
};

type MonsterSystem = {
  description?: string;
  attributes?: Record<string, { value?: number; mod?: number }>;
  resources?: {
    vida?: { value?: number; max?: number };
    pontosAcao?: { value?: number; max?: number };
  };
  movement?: { hex?: { walk?: { value?: number }; run?: { value?: number } } };
  tactical?: {
    defesa?: { value?: number };
    ameaca?: { value?: number };
    tier?: string;
  };
  actions?: CombatActionOption[];
};

function parseMonsterTier(raw: string | undefined, ameaca: number): MonsterTier {
  const t = raw?.toLowerCase();
  if (t === "mini" || t === "mini-boss" || t === "miniboss") return "mini";
  if (t === "boss") return "boss";
  if (ameaca >= 4) return "boss";
  if (ameaca >= 2) return "mini";
  return "mob";
}

const MONSTER_COLORS = ["#8b4513", "#6b5344", "#4a6741", "#7a4a6a", "#556b2f"];

function parseMonster(raw: CompendiumEntryRaw, index: number): MonsterTemplate {
  const entryId = raw.id ?? `monstros-${slugId(raw.name) || index}`;
  const sys = raw.system as MonsterSystem;
  const attrs = sys.attributes ?? {};
  const resources = sys.resources ?? {};
  const movement = sys.movement?.hex ?? {};
  const tactical = sys.tactical ?? {};
  const ameaca = tactical.ameaca?.value ?? 1;

  const tier = parseMonsterTier(tactical.tier, ameaca);
  const tierFloor = tier === "boss" ? 9 : MONSTER_PA_MIN;
  const rawPaMax = resources.pontosAcao?.max ?? resources.pontosAcao?.value ?? tierFloor;
  const rawPa = resources.pontosAcao?.value ?? rawPaMax;
  const { pa, paMax } = normalizeMonsterPa(rawPaMax, rawPa, tier);

  return {
    entryId,
    name: raw.name,
    description: sys.description ?? "",
    tier,
    vida: resources.vida?.value ?? resources.vida?.max ?? 10,
    vidaMax: resources.vida?.max ?? resources.vida?.value ?? 10,
    pa,
    paMax,
    defesa: tactical.defesa?.value ?? 10,
    walk: movement.walk?.value ?? 4,
    run: movement.run?.value ?? 6,
    ameaca,
    forca: attrs.forca?.value ?? 10,
    agilidade: attrs.agilidade?.value ?? 10,
    actions: (sys.actions as CombatActionOption[] | undefined) ?? [],
  };
}

const TEMPLATES: MonsterTemplate[] = (monstrosData as CompendiumEntryRaw[]).map(parseMonster);

const byId = new Map(TEMPLATES.map((t) => [t.entryId, t]));

export const MONSTER_REGISTRY = TEMPLATES;

export function getMonsterTemplate(entryId: string): MonsterTemplate | null {
  return byId.get(entryId) ?? null;
}

export function listMonsterTemplates(): MonsterTemplate[] {
  return TEMPLATES;
}

export function scaleMonsterTemplate(
  template: MonsterTemplate,
  options?: MonsterSpawnOptions
): MonsterTemplate {
  return applyMonsterSpawnScaling(template, options);
}

export function createMonsterToken(
  template: MonsterTemplate,
  axial: Axial,
  id?: string,
  spawnMeta?: { variant?: MonsterSpawnVariant }
): BattleToken {
  const tokenId = id ?? `m-${slugId(template.name)}-${Date.now().toString(36).slice(-5)}`;
  const color = MONSTER_COLORS[template.ameaca % MONSTER_COLORS.length];

  return {
    id: tokenId,
    name: template.name,
    axial,
    color,
    walk: template.walk,
    run: template.run,
    pa: template.pa,
    paMax: template.paMax,
    ownerRole: "mestre",
    linked: false,
    nivel: template.ameaca,
    vida: template.vida,
    vidaMax: template.vidaMax,
    defesa: template.defesa,
    monsterEntryId: template.entryId,
    monsterTier: template.tier,
    monsterVariant: spawnMeta?.variant && spawnMeta.variant !== "normal" ? spawnMeta.variant : undefined,
    ...defaultMovementFields({ walk: template.walk, run: template.run }),
    footprint:
      template.tier === "mob" && template.walk <= 3 ? "small" : "medium",
  };
}

export function createMonsterTokenFromEntryId(
  entryId: string,
  axial: Axial,
  options?: MonsterSpawnOptions
): BattleToken | null {
  const base = getMonsterTemplate(entryId);
  if (!base) return null;
  const template = scaleMonsterTemplate(base, options);
  return createMonsterToken(template, axial, undefined, { variant: options?.variant });
}
