import type { CompendiumEntry } from "@/lib/compendium/types";
import type { AbilityEffect, CombatActionOption } from "@/lib/combat/types";

const ABILITY_BY_ID: Record<string, { effect: AbilityEffect; extras?: Partial<CombatActionOption> }> = {
  "habilidades-investida-hexagonal": { effect: "charge" },
  "habilidades-investida-do-guerreiro": { effect: "charge" },
  "habilidades-investida-barbara": { effect: "charge" },
  "habilidades-passo-das-sombras": { effect: "shadow_step" },
  "habilidades-forma-selvagem": { effect: "wild_shape" },
  "habilidades-reflexos-de-masmorra": { effect: "reaction_shift", extras: { selfTarget: true } },
  "habilidades-golpe-flanqueador": { effect: "melee_attack_bonus", extras: { attackBonus: 0 } },
  "habilidades-golpe-devastador": {
    effect: "melee_attack_bonus",
    extras: { attackBonus: 0, selfTarget: true },
  },
  "habilidades-emboscada": { effect: "melee_attack_bonus", extras: { attackBonus: 0 } },
  "habilidades-canalizar-energia": {
    effect: "melee_attack_bonus",
    extras: { bonusDamageFormula: "2d6", damageType: "radiante" },
  },
  "habilidades-postura-defensiva": { effect: "defense_buff", extras: { defesaBuffAmount: 2 } },
  "habilidades-esquiva-tatica": { effect: "defense_buff", extras: { defesaBuffAmount: 2 } },
  "habilidades-escudo-magico": { effect: "defense_buff", extras: { defesaBuffAmount: 3 } },
  "habilidades-barreira-de-cobre": { effect: "defense_buff", extras: { defesaBuffAmount: 2 } },
  "habilidades-furia-controlada": { effect: "defense_buff", extras: { defesaBuffAmount: 2 } },
  "habilidades-olhar-do-cacador": { effect: "mark" },
  "habilidades-tiro-certeiro": { effect: "ranged_advantage", extras: { selfTarget: true } },
  "habilidades-finta": { effect: "mark_disadvantage" },
  "habilidades-inspiracao-de-batalha": { effect: "ally_inspire", extras: { allyTarget: true } },
  "habilidades-cancao-de-cura": {
    effect: "heal_touch",
    extras: { allyTarget: true, damageFormula: "1d6", damageType: "cura" },
  },
  "habilidades-raio-arcano": {
    effect: "spell_strike",
    extras: {
      damageFormula: "1d10",
      damageType: "mágico",
      damageAttribute: "inteligencia",
      resolution: "attack",
    },
  },
  "habilidades-disparo-de-artilheiro": {
    effect: "spell_strike",
    extras: { damageFormula: "2d8", damageType: "perfurante", resolution: "attack" },
  },
  "habilidades-raizes-prendentes": {
    effect: "restrain",
    extras: {
      damageFormula: "0",
      resolution: "save",
      saveAttribute: "forca",
      damageType: "mágico",
    },
  },
};

const NAME_EFFECT: Record<string, AbilityEffect> = {
  "Investida Hexagonal": "charge",
  "Investida do Guerreiro": "charge",
  "Investida Bárbara": "charge",
  "Passo das Sombras": "shadow_step",
  "Forma Selvagem": "wild_shape",
  "Reflexos de Masmorra": "reaction_shift",
  "Golpe Flanqueador": "melee_attack_bonus",
  "Golpe Devastador": "melee_attack_bonus",
  Emboscada: "melee_attack_bonus",
  "Canalizar Energia": "melee_attack_bonus",
  "Postura Defensiva": "defense_buff",
  "Esquiva Tática": "defense_buff",
  "Escudo Mágico": "defense_buff",
  "Barreira de Cobre": "defense_buff",
  "Fúria Controlada": "defense_buff",
  "Olhar do Caçador": "mark",
  "Tiro Certeiro": "ranged_advantage",
  Finta: "mark_disadvantage",
  "Inspiração de Batalha": "ally_inspire",
  "Canção de Cura": "heal_touch",
  "Raio Arcano": "spell_strike",
  "Disparo de Artilheiro": "spell_strike",
  "Raízes Prendentes": "restrain",
};

export function abilityEffectFor(entry: CompendiumEntry): AbilityEffect | null {
  const mapped = ABILITY_BY_ID[entry.id];
  if (mapped) return mapped.effect;
  return NAME_EFFECT[entry.name] ?? null;
}

function defaultExtras(effect: AbilityEffect): Partial<CombatActionOption> {
  switch (effect) {
    case "defense_buff":
      return { selfTarget: true, defesaBuffAmount: 2 };
    case "charge":
    case "shadow_step":
    case "wild_shape":
      return { selfTarget: true };
    case "reaction_shift":
      return { selfTarget: true };
    case "ranged_advantage":
      return { selfTarget: true };
    case "heal_touch":
      return { allyTarget: true, damageFormula: "1d6", damageType: "cura" };
    case "ally_inspire":
      return { allyTarget: true };
    case "mark":
    case "mark_disadvantage":
      return {};
    case "spell_strike":
      return { damageFormula: "1d10", damageType: "mágico", resolution: "attack" };
    case "restrain":
      return {
        damageFormula: "0",
        resolution: "save",
        saveAttribute: "forca",
        damageType: "mágico",
      };
    case "melee_attack_bonus":
      return { attackBonus: 2 };
    default:
      return {};
  }
}

export function abilityFromEntry(entry: CompendiumEntry): CombatActionOption | null {
  const tactical = entry.system.tactical as
    | { alcanceHex?: { value?: number }; custoPontosAcao?: { value?: number } }
    | undefined;
  const effect = abilityEffectFor(entry);
  if (!effect) return null;

  const mapped = ABILITY_BY_ID[entry.id];
  const extras = { ...defaultExtras(effect), ...mapped?.extras };

  const rangeHex = tactical?.alcanceHex?.value ?? 1;
  const paCost = tactical?.custoPontosAcao?.value ?? 1;
  const selfTarget = extras.selfTarget ?? (effect === "defense_buff" || effect === "charge");
  const resolution = extras.resolution ?? (effect === "restrain" ? "save" : "attack");

  let attackBonus = extras.attackBonus ?? 0;
  if (effect === "melee_attack_bonus" && entry.name === "Golpe Devastador") {
    attackBonus = 0;
  }

  const targetLabel = selfTarget ? "self" : extras.allyTarget ? "aliado" : `${rangeHex} hex`;

  return {
    packId: "habilidades",
    entryId: entry.id,
    name: entry.name,
    kind: "ability",
    resolution,
    damageFormula: extras.damageFormula ?? "0",
    damageType: extras.damageType ?? "",
    attackBonus,
    rangeHex,
    paCost,
    abilityEffect: effect,
    selfTarget,
    allyTarget: extras.allyTarget,
    defesaBuffAmount: extras.defesaBuffAmount,
    damageAttribute: extras.damageAttribute,
    bonusDamageFormula: extras.bonusDamageFormula,
    saveAttribute: extras.saveAttribute,
    label: `${entry.name} · ${targetLabel} · PA ${paCost}`,
  };
}
