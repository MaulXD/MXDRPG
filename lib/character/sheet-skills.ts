import { antecedenteMeta } from "@/lib/character/wizard-meta";
import {
  ATTRIBUTE_LABELS,
  attributeMod,
  getClass,
  proficiencyBonus,
  type AttributeKey,
  type ClassId,
} from "@/lib/character/rules";
import type { CharacterSheet } from "@/lib/character/types";

export type SheetSkillId =
  | "percepcao"
  | "investigacao"
  | "religiao"
  | "iniciativa"
  | "furtividade"
  | "atletismo"
  | "sobrevivencia"
  | "arcanismo"
  | "historia"
  | "persuasao"
  | "intuicao"
  | "intimidacao"
  | "medicina"
  | "enganacao";

export type SheetSkillDef = {
  id: SheetSkillId;
  label: string;
  short: string;
  attr: AttributeKey;
  /** Perícia passiva (10 + mod) */
  passive?: boolean;
};

export const SHEET_QUICK_SKILLS: SheetSkillDef[] = [
  { id: "percepcao", label: "Percepção", short: "Percep.", attr: "sabedoria", passive: true },
  { id: "investigacao", label: "Investigação", short: "Invest.", attr: "inteligencia" },
  { id: "iniciativa", label: "Iniciativa", short: "Inic.", attr: "destreza" },
  { id: "furtividade", label: "Furtividade", short: "Furtiv.", attr: "destreza" },
  { id: "atletismo", label: "Atletismo", short: "Atlet.", attr: "forca" },
];

function normalizeSkillToken(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function mentionsSkill(haystack: string, skillLabel: string): boolean {
  const token = normalizeSkillToken(skillLabel);
  return normalizeSkillToken(haystack).includes(token);
}

export function isSkillTrained(actor: CharacterSheet, skill: SheetSkillDef): boolean {
  const ant = antecedenteMeta(actor.identity.antecedente);
  if (ant?.gains.some((g) => mentionsSkill(g, skill.label))) return true;
  const cls = getClass(actor.identity.classe as ClassId);
  if (cls && mentionsSkill(cls.proficiencies, skill.label)) return true;
  return false;
}

export function sheetSkillModifier(actor: CharacterSheet, skill: SheetSkillDef): number {
  if (skill.id === "iniciativa") {
    return actor.tactical.iniciativa;
  }
  const mod = attributeMod(actor.attributes[skill.attr]);
  const prof = isSkillTrained(actor, skill) ? proficiencyBonus(actor.identity.nivel) : 0;
  return mod + prof;
}

export function formatSkillMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function passiveScore(mod: number): number {
  return 10 + mod;
}

export function skillRollFormula(mod: number): string {
  if (mod === 0) return "1d20";
  if (mod > 0) return `1d20+${mod}`;
  return `1d20${mod}`;
}

export type SheetQuickSkill = {
  def: SheetSkillDef;
  mod: number;
  display: string;
  rollFormula: string;
  passive?: number;
  trained: boolean;
};

export const RELIGIAO_SKILL: SheetSkillDef = {
  id: "religiao",
  label: "Religião",
  short: "Relig.",
  attr: "inteligencia",
};

export function buildSheetQuickSkills(actor: CharacterSheet): SheetQuickSkill[] {
  return SHEET_QUICK_SKILLS.map((def) => {
    const mod = sheetSkillModifier(actor, def);
    return {
      def,
      mod,
      display: formatSkillMod(mod),
      rollFormula: skillRollFormula(mod),
      passive: def.passive ? passiveScore(mod) : undefined,
      trained: isSkillTrained(actor, def),
    };
  });
}

/** Skills that can be granted by antecedente but aren't in the fixed quick-skills list. */
export const ANTECEDENTE_SKILL_DEFS: SheetSkillDef[] = [
  { id: "sobrevivencia", label: "Sobrevivência", short: "Sobrev.", attr: "sabedoria" },
  { id: "arcanismo",     label: "Arcanismo",     short: "Arcanism.", attr: "inteligencia" },
  { id: "historia",      label: "História",       short: "Histór.", attr: "inteligencia" },
  { id: "persuasao",     label: "Persuasão",      short: "Persuas.", attr: "carisma" },
  { id: "intuicao",      label: "Intuição",        short: "Intuição", attr: "sabedoria" },
  { id: "intimidacao",   label: "Intimidação",    short: "Intimid.", attr: "carisma" },
  { id: "medicina",      label: "Medicina",        short: "Medic.", attr: "sabedoria" },
  { id: "enganacao",     label: "Enganação",       short: "Engan.", attr: "carisma" },
];

/** Returns trained skills granted by the character's antecedente that aren't in the fixed panel. */
export function buildSheetBackgroundSkills(actor: CharacterSheet): SheetQuickSkill[] {
  const ant = antecedenteMeta(actor.identity.antecedente);
  if (!ant) return [];
  const prof = proficiencyBonus(actor.identity.nivel);

  if (actor.identity.antecedente === "Aventureiro") {
    const chosenId = actor.identity.escolhaPericiaAntecedente;
    if (!chosenId) return [];
    const def = ANTECEDENTE_SKILL_DEFS.find((d) => d.id === chosenId);
    if (!def) return [];
    const base = attributeMod(actor.attributes[def.attr]);
    const total = base + prof;
    return [{ def, mod: total, display: formatSkillMod(total), rollFormula: skillRollFormula(total), trained: true }];
  }

  return ANTECEDENTE_SKILL_DEFS.filter((def) =>
    ant.gains.some((g) => mentionsSkill(g, def.label))
  ).map((def) => {
    const base = attributeMod(actor.attributes[def.attr]);
    const total = base + prof;
    return {
      def,
      mod: total,
      display: formatSkillMod(total),
      rollFormula: skillRollFormula(total),
      trained: true,
    };
  });
}

export function buildSheetReligionSkill(actor: CharacterSheet): SheetQuickSkill {
  const mod = sheetSkillModifier(actor, RELIGIAO_SKILL);
  return {
    def: RELIGIAO_SKILL,
    mod,
    display: formatSkillMod(mod),
    rollFormula: skillRollFormula(mod),
    trained: isSkillTrained(actor, RELIGIAO_SKILL),
  };
}

/** Salvaguardas proficientes por classe (padrão d20, alinhado às classes Eldarin). */
const CLASS_SAVE_PROFICIENCIES: Partial<Record<ClassId, AttributeKey[]>> = {
  Guerreiro: ["forca", "constituicao"],
  Patrulheiro: ["destreza", "sabedoria"],
  Ladino: ["destreza", "inteligencia"],
  Mago: ["inteligencia", "sabedoria"],
  Clérigo: ["sabedoria", "carisma"],
  Bárbaro: ["forca", "constituicao"],
  Bardo: ["destreza", "carisma"],
  Druida: ["inteligencia", "sabedoria"],
  Feiticeiro: ["inteligencia", "carisma"],
  Espiritualista: ["destreza", "sabedoria"],
  Paladino: ["sabedoria", "carisma"],
  Bruxo: ["sabedoria", "carisma"],
};

export type SheetSavingThrow = {
  attr: AttributeKey;
  label: string;
  mod: number;
  display: string;
  trained: boolean;
};

export function isSaveTrained(actor: CharacterSheet, attr: AttributeKey): boolean {
  const saves = CLASS_SAVE_PROFICIENCIES[actor.identity.classe as ClassId];
  return saves?.includes(attr) ?? false;
}

export function buildSheetSavingThrows(actor: CharacterSheet): SheetSavingThrow[] {
  const prof = proficiencyBonus(actor.identity.nivel);
  return (Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((attr) => {
    const base = attributeMod(actor.attributes[attr]);
    const trained = isSaveTrained(actor, attr);
    const mod = base + (trained ? prof : 0);
    return {
      attr,
      label: ATTRIBUTE_LABELS[attr],
      mod,
      display: formatSkillMod(mod),
      trained,
    };
  });
}

export function resolveSheetSkillRoll(
  actor: CharacterSheet,
  skillId: SheetSkillId
): SheetQuickSkill | null {
  if (skillId === "religiao") return buildSheetReligionSkill(actor);
  const def = SHEET_QUICK_SKILLS.find((s) => s.id === skillId);
  if (!def) return null;
  const mod = sheetSkillModifier(actor, def);
  return {
    def,
    mod,
    display: formatSkillMod(mod),
    rollFormula: skillRollFormula(mod),
    passive: def.passive ? passiveScore(mod) : undefined,
    trained: isSkillTrained(actor, def),
  };
}
