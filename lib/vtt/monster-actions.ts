import type { CombatActionOption } from "@/lib/combat/types";
import {
  normalizeMonsterActionPa,
  PA_OFFENSIVE_ACTION_COST,
} from "@/lib/combat/pa-balance";
import { getMonsterTemplate } from "@/lib/vtt/monsters";

function mod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function generatedMonsterActions(
  entryId: string,
  t: NonNullable<ReturnType<typeof getMonsterTemplate>>
): CombatActionOption[] {
  const forMod = mod(t.forca);
  const dexMod = mod(t.agilidade);
  const pa = PA_OFFENSIVE_ACTION_COST;
  const actions: CombatActionOption[] = [];

  const biteDmg = t.tier === "boss" ? "2d8" : t.tier === "mini" ? "1d10" : "1d6";
  const clawDmg = t.tier === "boss" ? "2d6" : "1d8";

  actions.push({
    packId: "unarmed",
    entryId: `${entryId}-mordida`,
    name: "Mordida",
    kind: "weapon",
    resolution: "attack",
    damageFormula: biteDmg,
    damageType: "perfurante",
    attackBonus: t.ameaca >= 4 ? 2 : t.ameaca >= 2 ? 1 : 0,
    rangeCells: 1,
    paCost: pa,
    label: `Mordida · 1 cél. · PA ${pa}`,
  });

  if (t.tier !== "mob" || t.ameaca >= 2) {
    actions.push({
      packId: "unarmed",
      entryId: `${entryId}-garras`,
      name: "Garras",
      kind: "weapon",
      resolution: "attack",
      damageFormula: clawDmg,
      damageType: "cortante",
      attackBonus: dexMod,
      rangeCells: 1,
      paCost: pa,
      label: `Garras · 1 cél. · PA ${pa}`,
    });
  }

  if (t.ameaca >= 4) {
    actions.push({
      packId: "unarmed",
      entryId: `${entryId}-special`,
      name: "Ataque especial",
      kind: "spell",
      resolution: "attack",
      damageFormula: t.tier === "boss" ? "3d10" : "2d8",
      damageType: "mágico",
      attackBonus: t.ameaca,
      rangeCells: t.tier === "boss" ? 6 : 4,
      paCost: pa,
      label: `Ataque especial · ${t.tier === "boss" ? 6 : 4} cél. · PA ${pa}`,
    });
  } else if (t.ameaca >= 2) {
    actions.push({
      packId: "unarmed",
      entryId: `${entryId}-special`,
      name: "Investida",
      kind: "weapon",
      resolution: "attack",
      damageFormula: "1d10",
      damageType: "contundente",
      attackBonus: forMod,
      rangeCells: 2,
      paCost: pa,
      label: `Investida · 2 cél. · PA ${pa}`,
    });
  }

  return actions;
}

export function monsterCombatActions(entryId: string): CombatActionOption[] {
  const t = getMonsterTemplate(entryId);
  if (!t) return [];

  const raw =
    t.actions.length > 0
      ? t.actions.map((a) => ({
          ...a,
          label: a.label ?? `${a.name} · ${a.rangeCells ?? 1} cél. · PA ${a.paCost}`,
        }))
      : generatedMonsterActions(entryId, t);

  return raw.map(normalizeMonsterActionPa);
}
