import { computeDerivedStats, computeLoad } from "./rules";
import type { TorCharacterSheet } from "./types";

/** Preenche defaults em fichas legadas/parciais — mesmo padrão de lib/character/normalize.ts. */
export function normalizeTorCharacter(raw: TorCharacterSheet): TorCharacterSheet {
  const derived = computeDerivedStats(raw.culture, raw.attributes);
  const enduranceMax = raw.endurance?.max ?? derived.enduranceMax;
  const hopeMax = raw.hope?.max ?? derived.hopeMax;
  const endurance = {
    max: enduranceMax,
    value: Math.min(raw.endurance?.value ?? enduranceMax, enduranceMax),
  };
  const hope = {
    max: hopeMax,
    value: Math.min(raw.hope?.value ?? hopeMax, hopeMax),
  };
  const warGear = raw.warGear ?? [];
  const armour = raw.armour ?? { armourId: null, helm: false, shieldId: null };
  const load = computeLoad(warGear, armour, raw.culture);
  const shadow = raw.shadow ?? 0;

  return {
    ...raw,
    system: "um-anel",
    campaignRoomId: raw.campaignRoomId ?? null,
    adventureId: raw.adventureId ?? null,
    endurance,
    hope,
    shadow,
    parry: raw.parry ?? derived.parry,
    shieldParryBonus: raw.shieldParryBonus ?? 0,
    conditions: {
      // Cansado/Deplorável são derivados das regras (Carga vs Resistência, Sombra vs Esperança
      // atual) — não ficam a cargo de um toggle manual. Ferido continua manual (evento de jogo).
      weary: endurance.value <= load,
      miserable: shadow >= hope.value,
      wounded: raw.conditions?.wounded ?? false,
    },
    warGear,
    armour,
    usefulItems: raw.usefulItems ?? [],
    distinctiveFeatures: raw.distinctiveFeatures ?? [],
    rewards: raw.rewards ?? [],
    virtues: raw.virtues ?? [],
    load,
  };
}
