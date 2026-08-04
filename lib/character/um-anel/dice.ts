import { ATTRIBUTE_LABEL, COMBAT_PROFICIENCY_LABEL, SKILLS, SKILL_LABEL } from "./data";
import { attributeTN, isTorIllFavouredByShadow } from "./rules";
import type { TorCharacterSheet, TorCombatProficiencyId, TorSkillId } from "./types";

/**
 * Motor de resolução do Um Anel 2ª ed. (Dado de Proeza d12 + Dados de Sucesso d6).
 * Regras extraídas de livros/um-anel/02-resolucao-de-acoes.md — ver ali pra fonte de cada
 * decisão. Rodável só no cliente (usa Math.random, não em contexto de Workflow).
 */

type FeatDieKind = "number" | "eye" | "gandalf";

export type FeatDieRoll = { kind: FeatDieKind; numeric: number; label: string };

/** Face física do d12 (1-12) — pro visual do dado no chat; distinto do valor de jogo
 * (`numeric`, que já zera o Olho e conta a Runa de Gandalf como 10). */
export function featDiePhysicalFace(featDie: Pick<FeatDieRoll, "kind" | "numeric">): number {
  if (featDie.kind === "eye") return 11;
  if (featDie.kind === "gandalf") return 12;
  return featDie.numeric;
}

/** Payload pro ícone de dado no chat (ver RoomChat.tsx) — sempre um d12 (Dado de Proeza). */
export type TorFeatDieRollPayload = { sides: 12; value: number };

export function featDieRollPayload(featDie: Pick<FeatDieRoll, "kind" | "numeric">): TorFeatDieRollPayload {
  return { sides: 12, value: featDiePhysicalFace(featDie) };
}

function rollOneFeatDie(): FeatDieRoll {
  const raw = 1 + Math.floor(Math.random() * 12);
  if (raw === 11) return { kind: "eye", numeric: 0, label: "Olho de Sauron" };
  if (raw === 12) return { kind: "gandalf", numeric: 10, label: "Runa de Gandalf" };
  return { kind: "number", numeric: raw, label: String(raw) };
}

/** Ordem de "força" pra escolher entre 2 dados em rolagem Favorecida/Desfavorecida. */
function featDieRank(d: FeatDieRoll): number {
  if (d.kind === "eye") return -1;
  if (d.kind === "gandalf") return 11;
  return d.numeric;
}

export type TorSuccessDie = { value: number; icon: boolean; zeroedByWeary: boolean };

export type TorRollOutcome = {
  featDie: FeatDieRoll;
  featDiceRolled: FeatDieRoll[];
  successDice: TorSuccessDie[];
  total: number;
  tn: number;
  success: boolean;
  autoSuccess: boolean;
  autoFail: boolean;
  successIcons: number;
  degree: "failure" | "success" | "great" | "extraordinary";
  favoured: boolean;
  illFavoured: boolean;
};

export function rollTorCheck(opts: {
  rank: number;
  tn: number;
  favoured?: boolean;
  illFavoured?: boolean;
  weary?: boolean;
  miserable?: boolean;
}): TorRollOutcome {
  // Favorecida + Desfavorecida ao mesmo tempo se cancelam (livro, "Die Roll Modifiers").
  const favoured = Boolean(opts.favoured) && !opts.illFavoured;
  const illFavoured = Boolean(opts.illFavoured) && !opts.favoured;

  const rollCount = favoured || illFavoured ? 2 : 1;
  const featDiceRolled = Array.from({ length: rollCount }, () => rollOneFeatDie());
  const featDie = illFavoured
    ? featDiceRolled.reduce((a, b) => (featDieRank(b) < featDieRank(a) ? b : a))
    : featDiceRolled.reduce((a, b) => (featDieRank(b) > featDieRank(a) ? b : a));

  const successDice: TorSuccessDie[] = Array.from({ length: Math.max(0, opts.rank) }, () => {
    const value = 1 + Math.floor(Math.random() * 6);
    const zeroedByWeary = Boolean(opts.weary) && value <= 3;
    return { value, icon: value === 6, zeroedByWeary };
  });

  const successSum = successDice.reduce((sum, d) => sum + (d.zeroedByWeary ? 0 : d.value), 0);
  const total = featDie.numeric + successSum;

  const autoSuccess = featDie.kind === "gandalf";
  const autoFail = !autoSuccess && Boolean(opts.miserable) && featDie.kind === "eye";
  const success = autoSuccess ? true : autoFail ? false : total >= opts.tn;

  const successIcons = successDice.filter((d) => d.icon).length;
  const degree: TorRollOutcome["degree"] = !success
    ? "failure"
    : successIcons >= 2
      ? "extraordinary"
      : successIcons === 1
        ? "great"
        : "success";

  return {
    featDie,
    featDiceRolled,
    successDice,
    total,
    tn: opts.tn,
    success,
    autoSuccess,
    autoFail,
    successIcons,
    degree,
    favoured,
    illFavoured,
  };
}

const DEGREE_LABEL: Record<TorRollOutcome["degree"], string> = {
  failure: "FALHA",
  success: "sucesso",
  great: "GRANDE SUCESSO",
  extraordinary: "SUCESSO EXTRAORDINÁRIO",
};

export function formatTorRollMessage(actionLabel: string, outcome: TorRollOutcome): string {
  const modifierTag = outcome.favoured ? " (Favorecida)" : outcome.illFavoured ? " (Desfavorecida)" : "";
  const successDiceTxt =
    outcome.successDice.length > 0
      ? ` + Sucesso [${outcome.successDice.map((d) => (d.zeroedByWeary ? `${d.value}→0` : String(d.value))).join(", ")}]`
      : "";
  const featTxt =
    outcome.featDie.kind === "number" ? `Proeza ${outcome.featDie.label}` : `Proeza: ${outcome.featDie.label}`;

  if (outcome.autoSuccess) {
    return `${actionLabel}${modifierTag} — ${featTxt} → SUCESSO AUTOMÁTICO${outcome.successIcons > 0 ? ` (${DEGREE_LABEL[outcome.degree]})` : ""}`;
  }
  if (outcome.autoFail) {
    return `${actionLabel}${modifierTag} — ${featTxt} (Arrasado) → FALHA AUTOMÁTICA`;
  }
  return `${actionLabel}${modifierTag} — ${featTxt}${successDiceTxt} = ${outcome.total} vs NA ${outcome.tn} → ${DEGREE_LABEL[outcome.degree]}`;
}

function skillGroup(skillId: TorSkillId) {
  return SKILLS.find((s) => s.id === skillId)?.group ?? "forca";
}

/** Desfavorecido pela Sombra, lido da ficha (ver isTorIllFavouredByShadow). */
function torSheetIllFavoured(character: TorCharacterSheet): boolean {
  return isTorIllFavouredByShadow({
    shadow: character.shadow,
    shadowScars: character.shadowScars,
    hopeMax: character.hope.max,
  });
}

export function rollTorSkillCheck(
  character: TorCharacterSheet,
  skillId: TorSkillId
): { outcome: TorRollOutcome; message: string } {
  const group = skillGroup(skillId);
  const tn = attributeTN(character.attributes[group]);
  const rank = character.skills[skillId] ?? 0;
  const favoured = character.favouredSkills.includes(skillId);
  const outcome = rollTorCheck({
    rank,
    tn,
    favoured,
    // Arrasado NÃO desfavorece — só faz o Olho virar falha, o que `miserable`
    // abaixo já cobre. Desfavorecido é a condição separada da Esperança máxima.
    illFavoured: torSheetIllFavoured(character),
    weary: character.conditions.weary,
    miserable: character.conditions.miserable,
  });
  const label = `${character.name} — ${SKILL_LABEL[skillId]} (${ATTRIBUTE_LABEL[group]} ${rank})`;
  return { outcome, message: formatTorRollMessage(label, outcome) };
}

export function rollTorCombatProficiencyCheck(
  character: TorCharacterSheet,
  profId: TorCombatProficiencyId
): { outcome: TorRollOutcome; message: string } {
  const tn = attributeTN(character.attributes.forca);
  const rank = character.combatProficiencies[profId] ?? 0;
  // Proficiências de combate nunca são Favorecidas por serem Proficiências —
  // só uma Virtude pode favorecê-las (ex.: "Certeiro no Alvo", do Bilbo
  // pré-gerado). Virtudes ainda não entram nas rolagens; quando entrarem, é
  // aqui que o `favoured` deixa de ser fixo.
  const outcome = rollTorCheck({
    rank,
    tn,
    favoured: false,
    illFavoured: torSheetIllFavoured(character),
    weary: character.conditions.weary,
    miserable: character.conditions.miserable,
  });
  const label = `${character.name} — ${COMBAT_PROFICIENCY_LABEL[profId]} (Força ${rank})`;
  return { outcome, message: formatTorRollMessage(label, outcome) };
}
