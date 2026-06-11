import type { TokenCondition } from "@/lib/combat/conditions";
import { hasCondition, toggleTokenCondition } from "@/lib/combat/conditions";
import type { CombatTickContext, TimedEffectInput } from "@/lib/combat/timed-effects";
import { addTimedEffect } from "@/lib/combat/timed-effects";
import type { BattleToken } from "@/lib/vtt/types";

export type ConsumableEffectKind =
  | "heal"
  | "clear_condition"
  | "defesa_bonus"
  | "weapon_coating"
  | "save_advantage_poison"
  | "buff_chip";

export type ConsumableEffectDef = {
  kind: ConsumableEffectKind;
  formula?: string;
  condition?: TokenCondition;
  bonus?: number;
  rounds?: number;
  turns?: number;
  label?: string;
  hint: string;
};

/** Efeitos por catalogId (POC-01 … POC-24). Durações longas viram rodadas de combate. */
export const CONSUMABLE_CATALOG_EFFECTS: Record<string, ConsumableEffectDef> = {
  "POC-01": { kind: "heal", formula: "2d4+2", hint: "Cura 2d4+2 HP" },
  "POC-02": { kind: "heal", formula: "4d4+4", hint: "Cura 4d4+4 HP" },
  "POC-03": { kind: "heal", formula: "8d4+8", hint: "Cura 8d4+8 HP" },
  "POC-04": { kind: "clear_condition", condition: "envenenado", hint: "Remove veneno ativo" },
  "POC-05": {
    kind: "save_advantage_poison",
    rounds: 10,
    label: "Antídoto de masmorra",
    hint: "Vantagem em salvaguardas vs veneno (10 rodadas)",
  },
  "POC-06": {
    kind: "buff_chip",
    label: "Força de touro",
    rounds: 10,
    hint: "FOR +2 (10 rodadas; narrativo fora de testes)",
  },
  "POC-07": {
    kind: "buff_chip",
    label: "Agilidade felina",
    rounds: 10,
    hint: "DES +2 (10 rodadas)",
  },
  "POC-08": {
    kind: "buff_chip",
    label: "Vigor de urso",
    rounds: 10,
    hint: "CON +2 (10 rodadas)",
  },
  "POC-09": {
    kind: "buff_chip",
    label: "Clarividência",
    rounds: 20,
    hint: "Vantagem em Percepção (encontro)",
  },
  "POC-10": {
    kind: "buff_chip",
    label: "Resist. fogo",
    rounds: 10,
    hint: "Resistência a fogo",
  },
  "POC-11": {
    kind: "buff_chip",
    label: "Resist. gelo",
    rounds: 10,
    hint: "Resistência a gelo",
  },
  "POC-12": {
    kind: "buff_chip",
    label: "Resist. ácido",
    rounds: 10,
    hint: "Resistência a ácido",
  },
  "POC-13": {
    kind: "buff_chip",
    label: "Elixir de trinchar",
    rounds: 20,
    hint: "+2 Extração (culinária)",
  },
  "POC-14": {
    kind: "buff_chip",
    label: "Elixir harmonização",
    rounds: 20,
    hint: "+2 Forrageio (culinária)",
  },
  "POC-15": {
    kind: "buff_chip",
    label: "Estômago de ferro",
    rounds: 30,
    hint: "Imune a podridão leve",
  },
  "POC-16": {
    kind: "buff_chip",
    label: "Mutação estável",
    rounds: 20,
    hint: "1 mutação leve estável",
  },
  "POC-17": {
    kind: "weapon_coating",
    formula: "1d6",
    turns: 5,
    label: "Veneno (arma)",
    hint: "+1d6 veneno nos próximos ataques (5 turnos)",
  },
  "POC-18": {
    kind: "buff_chip",
    label: "Preservação orgânica",
    rounds: 30,
    hint: "Preserva ingrediente (narrativo)",
  },
  "POC-19": {
    kind: "buff_chip",
    label: "Respiração abissal",
    rounds: 20,
    hint: "Respiração aquática",
  },
  "POC-20": {
    kind: "defesa_bonus",
    bonus: 2,
    rounds: 10,
    label: "Pele de pedra",
    hint: "+2 CA por 10 rodadas",
  },
  "POC-21": {
    kind: "buff_chip",
    label: "Passo silencioso",
    rounds: 20,
    hint: "Vantagem em Furtividade",
  },
  "POC-22": {
    kind: "buff_chip",
    label: "Visão no escuro",
    rounds: 20,
    hint: "Visão no escuro 18 m",
  },
  "POC-23": {
    kind: "heal",
    formula: "1d8",
    hint: "Cura 1d8 HP (em combate: só em si)",
  },
  "POC-24": {
    kind: "buff_chip",
    label: "Elixir de Valdrun",
    rounds: 30,
    hint: "1 Prato Perfeito — combine com o mestre",
  },
};

export const CONSUMABLE_CATALOG_IDS = Object.keys(CONSUMABLE_CATALOG_EFFECTS).sort();

export function consumableEffectDef(catalogId: string): ConsumableEffectDef | null {
  return CONSUMABLE_CATALOG_EFFECTS[catalogId] ?? null;
}

export function consumableHealFormula(catalogId: string): string | undefined {
  const def = consumableEffectDef(catalogId);
  return def?.kind === "heal" ? def.formula : undefined;
}

function timedChip(
  token: BattleToken,
  input: TimedEffectInput,
  ctx: CombatTickContext
): BattleToken {
  return addTimedEffect(token, {
    ...input,
    appliedRound: ctx.round,
    appliedActiveIndex: ctx.activeIndex,
  });
}

export function applyConsumableBuffs(
  token: BattleToken,
  catalogId: string,
  ctx: CombatTickContext
): { token: BattleToken; notes: string[] } {
  const def = consumableEffectDef(catalogId);
  if (!def) return { token, notes: [] };

  const notes: string[] = [];
  let next = token;

  switch (def.kind) {
    case "clear_condition": {
      if (!def.condition) break;
      if (hasCondition(next, def.condition)) {
        next = { ...next, conditions: toggleTokenCondition(next, def.condition) };
        notes.push(`Remove ${def.condition}`);
      } else {
        notes.push(`Sem ${def.condition} ativo`);
      }
      break;
    }
    case "defesa_bonus": {
      const bonus = def.bonus ?? 0;
      next = {
        ...next,
        defesaBonus: (next.defesaBonus ?? 0) + bonus,
        defesaBuffSource: def.label ?? "Poção",
      };
      next = timedChip(
        next,
        {
          kind: "buff",
          label: def.label ?? `+${bonus} CA`,
          roundsLeft: def.rounds ?? 10,
          clearFields: ["defesaBonus", "defesaBuffSource"],
        },
        ctx
      );
      notes.push(def.hint);
      break;
    }
    case "weapon_coating": {
      next = { ...next, bonusDamageFormula: def.formula ?? "1d6" };
      next = timedChip(
        next,
        {
          kind: "buff",
          label: def.label ?? "Veneno (arma)",
          turnsLeft: def.turns ?? 5,
          clearFields: ["bonusDamageFormula"],
        },
        ctx
      );
      notes.push(def.hint);
      break;
    }
    case "save_advantage_poison": {
      next = { ...next, saveAdvantagePoison: true };
      next = timedChip(
        next,
        {
          kind: "buff",
          label: def.label ?? "Antídoto de masmorra",
          roundsLeft: def.rounds ?? 10,
          clearFields: ["saveAdvantagePoison"],
        },
        ctx
      );
      notes.push(def.hint);
      break;
    }
    case "buff_chip": {
      next = timedChip(
        next,
        {
          kind: "buff",
          label: def.label ?? def.hint,
          roundsLeft: def.rounds ?? 10,
        },
        ctx
      );
      notes.push(def.hint);
      break;
    }
    default:
      break;
  }

  return { token: next, notes };
}
