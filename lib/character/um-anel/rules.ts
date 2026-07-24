import { ARMOUR_BY_ID, CULTURE_BY_ID, SHIELD_BY_ID, WEAPON_BY_ID } from "./data";
import type { TorArmourLoadout, TorAttributes, TorCultureId, TorWarGearItem } from "./types";

/** NA (Número-Alvo) de um Atributo = 20 - valor do Atributo (Core Rules p.29). */
export function attributeTN(score: number): number {
  return 20 - score;
}

export function computeDerivedStats(
  cultureId: TorCultureId,
  attributes: TorAttributes
): { enduranceMax: number; hopeMax: number; parry: number } {
  const culture = CULTURE_BY_ID[cultureId];
  return {
    enduranceMax: attributes.forca + culture.enduranceBonus,
    hopeMax: attributes.coracao + culture.hopeBonus,
    parry: attributes.argucia + culture.parryBonus,
  };
}

function parseLoadValue(load: number): number {
  return Number.isFinite(load) ? load : 0;
}

/** Carga total de Equipamento de Guerra + armadura/elmo/escudo carregados. */
export function computeLoad(
  warGear: TorWarGearItem[],
  armour: TorArmourLoadout,
  cultureId: TorCultureId
): number {
  const culture = CULTURE_BY_ID[cultureId];
  let total = 0;

  for (const item of warGear) {
    const weapon = WEAPON_BY_ID[item.weaponId];
    if (weapon) total += parseLoadValue(weapon.load);
  }

  if (armour.armourId) {
    const armourDef = ARMOUR_BY_ID[armour.armourId];
    if (armourDef) {
      const isDwarf = cultureId === "anoes";
      const load = parseLoadValue(armourDef.load);
      total += isDwarf ? Math.ceil(load / 2) : load;
    }
  }
  if (armour.helm) {
    const helmLoad = parseLoadValue(ARMOUR_BY_ID.elmo.load);
    total += cultureId === "anoes" ? Math.ceil(helmLoad / 2) : helmLoad;
  }
  if (armour.shieldId) {
    const shieldDef = SHIELD_BY_ID[armour.shieldId];
    if (shieldDef) total += parseLoadValue(shieldDef.load);
  }

  return total;
}

export function shieldParryBonus(shieldId?: string | null): number {
  if (!shieldId) return 0;
  return SHIELD_BY_ID[shieldId]?.parryModifier ?? 0;
}
