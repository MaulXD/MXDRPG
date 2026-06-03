import type { CombatActionOption } from "@/lib/combat/types";
import { getMonsterTemplate } from "@/lib/vtt/monsters";

function mod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function monsterCombatActions(entryId: string): CombatActionOption[] {
  const t = getMonsterTemplate(entryId);
  if (!t) return [];

  const forMod = mod(t.forca);
  const dexMod = mod(t.agilidade);
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
    rangeHex: 1,
    paCost: 1,
    label: `Mordida · 1 hex · PA 1`,
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
      rangeHex: 1,
      paCost: 1,
      label: `Garras · 1 hex · PA 1`,
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
      rangeHex: t.tier === "boss" ? 6 : 4,
      paCost: 2,
      label: `Ataque especial · ${t.tier === "boss" ? 6 : 4} hex · PA 2`,
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
      rangeHex: 2,
      paCost: 1,
      label: `Investida · 2 hex · PA 1`,
    });
  }

  return actions;
}
