import type { CompendiumEntry } from "@/lib/compendium/types";
import { PA_DEFAULT_ACTION_COST } from "@/lib/combat/pa-economy";
import { parseRecharge } from "@/lib/combat/recharge";
import type { AbilityEffect, CombatActionOption } from "@/lib/combat/types";

const ABILITY_BY_ID: Record<string, { effect: AbilityEffect; extras?: Partial<CombatActionOption> }> = {
  "habilidades-investida-em-linha": { effect: "charge" },
  "habilidades-investida-do-guerreiro": { effect: "charge" },
  "habilidades-investida-barbara": { effect: "charge" },
  "habilidades-passo-das-sombras": { effect: "shadow_step" },
  "habilidades-golpe-de-chi": {
    effect: "melee_attack_bonus",
    extras: { bonusDamageFormula: "1d8", damageType: "contundente", damageAttribute: "destreza" },
  },
  "habilidades-passo-do-vacuo": { effect: "shadow_step", extras: { selfTarget: true } },
  "habilidades-ferida-aberta": {
    effect: "melee_attack_bonus",
    extras: { bonusDamageFormula: "2d8", damageType: "contundente", damageAttribute: "destreza" },
  },
  "chi-golpe-de-chi": {
    effect: "melee_attack_bonus",
    extras: { bonusDamageFormula: "1d8", damageType: "contundente", damageAttribute: "destreza" },
  },
  "chi-passo-do-vacuo": { effect: "shadow_step", extras: { selfTarget: true } },
  "chi-ferida-aberta": {
    effect: "melee_attack_bonus",
    extras: { bonusDamageFormula: "2d8", damageType: "contundente", damageAttribute: "destreza" },
  },
  "chi-golpe-do-vacuo": {
    effect: "melee_attack_bonus",
    extras: { bonusDamageFormula: "1d6", damageType: "contundente", damageAttribute: "destreza" },
  },
  "chi-muro-de-chi": {
    effect: "defense_buff",
    extras: { defesaBuffAmount: 2, selfTarget: true },
  },
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
  "habilidades-imposicao-de-maos": {
    effect: "heal_touch",
    extras: { allyTarget: true, damageFormula: "1d8", damageType: "cura" },
  },
  "habilidades-golpe-sagrado": {
    effect: "melee_attack_bonus",
    extras: { bonusDamageFormula: "2d8", damageType: "radiante", selfTarget: true },
  },
  "habilidades-raio-do-pacto": {
    effect: "spell_strike",
    extras: {
      damageFormula: "1d10",
      damageType: "mágico",
      damageAttribute: "carisma",
      resolution: "attack",
    },
  },
  "habilidades-raio-do-pacto-psiquico": {
    effect: "spell_strike",
    extras: {
      damageFormula: "1d10",
      damageType: "psíquico",
      damageAttribute: "carisma",
      resolution: "attack",
    },
  },
  "habilidades-raio-do-pacto-ardente": {
    effect: "spell_strike",
    extras: {
      damageFormula: "1d10",
      damageType: "fogo",
      damageAttribute: "carisma",
      resolution: "attack",
    },
  },
  "habilidades-raio-do-pacto-salino": {
    effect: "spell_strike",
    extras: {
      damageFormula: "1d10",
      damageType: "frio",
      damageAttribute: "carisma",
      resolution: "attack",
    },
  },
  "habilidades-luz-penitente": {
    effect: "spell_strike",
    extras: { damageFormula: "2d8", damageType: "radiante", resolution: "attack" },
  },
  "habilidades-escudo-solar": {
    effect: "heal_touch",
    extras: { allyTarget: true, damageFormula: "1d10", damageType: "cura" },
  },
  "habilidades-julgamento-ardente": { effect: "mark" },
  "habilidades-coroa-de-fogo": {
    effect: "spell_strike",
    extras: {
      damageFormula: "4d8",
      damageType: "radiante",
      resolution: "save",
      saveAttribute: "destreza",
    },
  },
  "habilidades-lamina-dos-sepulcros": {
    effect: "melee_attack_bonus",
    extras: { bonusDamageFormula: "1d8", damageType: "radiante", selfTarget: true },
  },
  "habilidades-voto-de-caca": { effect: "mark" },
  "habilidades-marca-do-limiar": { effect: "mark_disadvantage" },
  "habilidades-processao-silenciosa": { effect: "shadow_step" },
  "habilidades-mordida-do-voto": {
    effect: "melee_attack_bonus",
    extras: { attackBonus: 2, selfTarget: true },
  },
  "habilidades-fera-interior": {
    effect: "melee_attack_bonus",
    extras: { bonusDamageFormula: "1d8", damageType: "perfurante", selfTarget: true },
  },
  "habilidades-carga-do-juramento": { effect: "charge" },
  "habilidades-pele-de-quimera": {
    effect: "melee_attack_bonus",
    extras: { bonusDamageFormula: "2d6", damageType: "cortante", selfTarget: true },
  },
  "habilidades-olhar-entre-dimensoes": {
    effect: "spell_strike",
    extras: { damageFormula: "2d6", damageType: "psíquico", resolution: "attack" },
  },
  "habilidades-agarrao-do-pacto": {
    effect: "restrain",
    extras: {
      damageFormula: "0",
      resolution: "save",
      saveAttribute: "forca",
      damageType: "psíquico",
    },
  },
  "habilidades-mente-partida": {
    effect: "restrain",
    extras: {
      damageFormula: "0",
      resolution: "save",
      saveAttribute: "inteligencia",
      damageType: "psíquico",
    },
  },
  "habilidades-sangue-do-patrono": {
    effect: "heal_touch",
    extras: { selfTarget: true, damageFormula: "1d8", damageType: "cura" },
  },
  "habilidades-pacto-de-ferro": {
    effect: "restrain",
    extras: {
      damageFormula: "3d8",
      resolution: "save",
      saveAttribute: "forca",
      damageType: "fogo",
    },
  },
  "habilidades-correntes-infernais": {
    effect: "spell_strike",
    extras: {
      damageFormula: "3d6",
      damageType: "fogo",
      resolution: "save",
      saveAttribute: "destreza",
    },
  },
  "habilidades-corrente-mental": { effect: "ally_inspire", extras: { allyTarget: true } },
  "habilidades-manto-de-bruma": { effect: "defense_buff", extras: { defesaBuffAmount: 2, selfTarget: true } },
  "habilidades-puxao-abissal": {
    effect: "restrain",
    extras: {
      damageFormula: "2d8",
      resolution: "save",
      saveAttribute: "forca",
      damageType: "frio",
    },
  },
};

const NAME_EFFECT: Record<string, AbilityEffect> = {
  "Investida em Linha": "charge",
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
  "Imposição de Mãos": "heal_touch",
  "Golpe Sagrado": "melee_attack_bonus",
  "Raio do Pacto": "spell_strike",
  "Raio do Pacto Psíquico": "spell_strike",
  "Raio do Pacto Ardente": "spell_strike",
  "Raio do Pacto Salino": "spell_strike",
  "Luz Penitente": "spell_strike",
  "Escudo Solar": "heal_touch",
  "Julgamento Ardente": "mark",
  "Coroa de Fogo": "spell_strike",
  "Lâmina dos Sepulcros": "melee_attack_bonus",
  "Voto de Caça": "mark",
  "Marca do Limiar": "mark_disadvantage",
  "Processão Silenciosa": "shadow_step",
  "Mordida do Voto": "melee_attack_bonus",
  "Fera Interior": "melee_attack_bonus",
  "Carga do Juramento": "charge",
  "Pele de Quimera": "melee_attack_bonus",
  "Olhar Entre Dimensões": "spell_strike",
  "Agarrão do Pacto": "restrain",
  "Mente Partida": "restrain",
  "Sangue do Patrono": "heal_touch",
  "Pacto de Ferro": "restrain",
  "Correntes Infernais": "spell_strike",
  "Corrente Mental": "ally_inspire",
  "Manto de Bruma": "defense_buff",
  "Puxão Abissal": "restrain",
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
    | {
        alcanceCells?: { value?: number };
        custoPontosAcao?: { value?: number };
        custoChi?: { value?: number };
      }
    | undefined;
  const abilityMeta = entry.system.ability as { recarga?: string } | undefined;
  const effect = abilityEffectFor(entry);
  if (!effect) return null;

  const mapped = ABILITY_BY_ID[entry.id];
  const extras = { ...defaultExtras(effect), ...mapped?.extras };

  const rangeCells = tactical?.alcanceCells?.value ?? 1;
  const paCost = tactical?.custoPontosAcao?.value ?? PA_DEFAULT_ACTION_COST;
  const chiCost = tactical?.custoChi?.value ?? 0;
  const selfTarget = extras.selfTarget ?? (effect === "defense_buff" || effect === "charge");
  const resolution = extras.resolution ?? (effect === "restrain" ? "save" : "attack");

  let attackBonus = extras.attackBonus ?? 0;
  if (effect === "melee_attack_bonus" && entry.name === "Golpe Devastador") {
    attackBonus = 0;
  }

  const targetLabel = selfTarget ? "self" : extras.allyTarget ? "aliado" : `${rangeCells} cél.`;

  return {
    packId: "habilidades",
    entryId: entry.id,
    name: entry.name,
    kind: "ability",
    resolution,
    damageFormula: extras.damageFormula ?? "0",
    damageType: extras.damageType ?? "",
    attackBonus,
    rangeCells,
    paCost,
    chiCost: chiCost > 0 ? chiCost : undefined,
    abilityEffect: effect,
    selfTarget,
    allyTarget: extras.allyTarget,
    defesaBuffAmount: extras.defesaBuffAmount,
    damageAttribute: extras.damageAttribute,
    bonusDamageFormula: extras.bonusDamageFormula,
    saveAttribute: extras.saveAttribute,
    recharge: parseRecharge(abilityMeta?.recarga) ?? undefined,
    label: `${entry.name} · ${targetLabel} · PA ${paCost}${chiCost > 0 ? ` · Chi ${chiCost}` : ""}`,
  };
}

/** Metadados mínimos quando a entrada ainda não está no JSON do compêndio. */
const KNOWN_ABILITY_META: Record<
  string,
  { name: string; pa?: number; chi?: number; range?: number; recarga?: string }
> = {
  "habilidades-golpe-de-chi": { name: "Golpe de Chi", pa: 1, chi: 1, range: 1 },
  "habilidades-passo-do-vacuo": { name: "Passo do Vácuo", pa: 1, chi: 1, range: 2, recarga: "1/turno" },
  "habilidades-ferida-aberta": { name: "Ferida Aberta", pa: 2, chi: 2, range: 1, recarga: "1/combate" },
};

/** Resolve habilidade só pelo id (ABILITY_BY_ID) — fallback se o JSON ainda não carregou. */
export function abilityFromKnownId(entryId: string): CombatActionOption | null {
  const mapped = ABILITY_BY_ID[entryId];
  const meta = KNOWN_ABILITY_META[entryId];
  if (!mapped || !meta) return null;

  return abilityFromEntry({
    id: entryId,
    packId: "habilidades",
    name: meta.name,
    type: "habilidade",
    system: {
      tactical: {
        alcanceCells: { value: meta.range ?? 1, min: 0 },
        custoPontosAcao: { value: meta.pa ?? 1, min: 0 },
        ...(meta.chi != null ? { custoChi: { value: meta.chi, min: 0 } } : {}),
      },
      ability: { tipo: "ativa", recarga: meta.recarga ?? "" },
    },
  } as CompendiumEntry);
}

