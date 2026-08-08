import { ATTRIBUTE_LABEL, COMBAT_PROFICIENCY_LABEL, SKILLS, SKILL_LABEL } from "./data";
import { attributeTN, isTorIllFavouredByShadow } from "./rules";
import { TOR_RANGED_PROFICIENCIES, torVirtueRollEffect } from "./virtues";
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
  /**
   * Bônus de Esperança: "um herói-jogador a ponto de fazer uma rolagem pode
   * gastar 1 ponto de Esperança para *ganhar (1d)*" — e **Inspirado dobra**,
   * dando (2d) pelo mesmo ponto (02-resolucao-de-acoes.md).
   *
   * É Dado de SUCESSO, não de Proeza: some ao rank, nunca a favoured. E o livro
   * fecha em UM ponto por rolagem — "não é possível gastar múltiplos pontos de
   * Esperança para ganhar múltiplos Dados de Sucesso bônus" —, por isso o valor
   * só pode ser 0, 1 ou 2.
   */
  hopeBonusDice?: number;
  /**
   * Dados de Sucesso de outras fontes, somados.
   *
   * Hoje o único emissor é o **Apoio** — "o personagem que apoia gasta 1 ponto de
   * Esperança para que o herói ativo *ganhe (1d)*" —, mas o campo é genérico
   * porque o livro diz que bônus e penalidades são **cumulativos**: "se um herói
   * ganha (1d) de um companheiro que apoia, ganha (2d) gastando Esperança
   * enquanto Inspirado, e perde (1d) de uma penalidade, a rolagem ganha (2d)".
   *
   * Somam-se — ao contrário de Favorecida/Desfavorecida, que se cancelam. Aceita
   * negativo, que é como a penalidade entra.
   */
  bonusDice?: number;
}): TorRollOutcome {
  // Favorecida + Desfavorecida ao mesmo tempo se cancelam (livro, "Die Roll Modifiers").
  const favoured = Boolean(opts.favoured) && !opts.illFavoured;
  const illFavoured = Boolean(opts.illFavoured) && !opts.favoured;

  const rollCount = favoured || illFavoured ? 2 : 1;
  const featDiceRolled = Array.from({ length: rollCount }, () => rollOneFeatDie());
  const featDie = illFavoured
    ? featDiceRolled.reduce((a, b) => (featDieRank(b) < featDieRank(a) ? b : a))
    : featDiceRolled.reduce((a, b) => (featDieRank(b) > featDieRank(a) ? b : a));

  // Teto 2: Inspirado dobra o bônus de UM ponto; não há como gastar dois pontos.
  const hopeDice = Math.min(2, Math.max(0, Math.floor(opts.hopeBonusDice ?? 0)));
  // Cumulativos, e o piso é zero: "penalidades descem até um mínimo de zero
  // Dados de Sucesso" (capítulo 2).
  const totalRank = Math.max(0, Math.max(0, opts.rank) + hopeDice + Math.floor(opts.bonusDice ?? 0));

  const successDice: TorSuccessDie[] = Array.from({ length: totalRank }, () => {
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

export type TorRollOptions = {
  /**
   * Regra opcional de campanha curta (NA 18). Quem conhece a mesa passa; a ficha
   * aberta fora de uma sala não tem como saber e cai no padrão do livro, 20.
   */
  attributeTnBase?: number;
  /** O jogador gastou 1 ponto de Esperança nesta rolagem. */
  spendHope?: boolean;
  /**
   * Herói Inspirado — invocou uma Característica Distintiva, ou tem uma Virtude
   * Cultural que inspira. Só faz diferença junto com o gasto de Esperança:
   * Inspirado **dobra o benefício**, não dá dado nenhum sozinho.
   */
  inspired?: boolean;
  /**
   * Apoio de um companheiro: ele gasta 1 de Esperança e o herói ativo *ganha
   * (1d)*. "Apenas um herói-jogador pode gastar Esperança para apoiar o herói
   * ativo" — por isso é booleano, não contador.
   */
  supported?: boolean;
};

/**
 * Dados de Sucesso vindos do Bônus de Esperança.
 *
 * Inspirado sem gasto de Esperança vale **zero** — é o erro mais fácil desta
 * regra. "Heróis-jogadores Inspirados dobram o benefício de gastar um ponto de
 * Esperança": sem o ponto, não há benefício para dobrar.
 */
export function torHopeBonusDice(opts: { spendHope?: boolean; inspired?: boolean }): number {
  if (!opts.spendHope) return 0;
  return opts.inspired ? 2 : 1;
}

function torHopeLabel(hopeBonusDice: number): string {
  if (hopeBonusDice <= 0) return "";
  return hopeBonusDice >= 2 ? " [Esperança, Inspirado +2d]" : " [Esperança +1d]";
}

export function rollTorSkillCheck(
  character: TorCharacterSheet,
  skillId: TorSkillId,
  opts: TorRollOptions = {}
): { outcome: TorRollOutcome; message: string } {
  const group = skillGroup(skillId);
  const tn = attributeTN(character.attributes[group], opts.attributeTnBase);
  const hopeBonusDice = torHopeBonusDice(opts);
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
    hopeBonusDice,
    // Apoio soma com o Bônus de Esperança — o livro diz que Dados de Sucesso
    // de fontes diferentes são cumulativos.
    bonusDice: opts.supported ? 1 : 0,
  });
  const label =
    `${character.name} — ${SKILL_LABEL[skillId]} (${ATTRIBUTE_LABEL[group]} ${rank})` +
    torHopeLabel(hopeBonusDice) +
    (opts.supported ? " [Apoio +1d]" : "");
  return { outcome, message: formatTorRollMessage(label, outcome) };
}

export function rollTorCombatProficiencyCheck(
  character: TorCharacterSheet,
  profId: TorCombatProficiencyId,
  opts: TorRollOptions = {}
): { outcome: TorRollOutcome; message: string } {
  const tn = attributeTN(character.attributes.forca, opts.attributeTnBase);
  const hopeBonusDice = torHopeBonusDice(opts);
  const rank = character.combatProficiencies[profId] ?? 0;
  // Proficiências de Combate nunca são Favorecidas por serem Proficiências (não
  // existe "Proficiência Favorecida" como as Perícias) — só uma Virtude pode
  // favorecê-las. Aqui só a Proficiência é conhecida, não a arma, então vale
  // apenas o que é à distância por definição (ver TOR_RANGED_PROFICIENCIES); o
  // ataque em mesa passa pelo handler, que conhece a arma e o alvo.
  const virtue = torVirtueRollEffect(character.virtues, {
    kind: "attack",
    ranged: (TOR_RANGED_PROFICIENCIES as readonly string[]).includes(profId),
  });
  const outcome = rollTorCheck({
    rank,
    tn,
    favoured: virtue.favoured,
    illFavoured: torSheetIllFavoured(character),
    weary: character.conditions.weary,
    miserable: character.conditions.miserable,
    hopeBonusDice,
    // Apoio soma com o Bônus de Esperança — o livro diz que Dados de Sucesso
    // de fontes diferentes são cumulativos.
    bonusDice: opts.supported ? 1 : 0,
  });
  // A Virtude aparece no rótulo: sem isso o jogador vê "(Favorecida)" e não tem
  // como saber de onde veio — nem o Mestre, pra conferir contra a ficha.
  const virtueTxt = virtue.sources.length > 0 ? ` [${virtue.sources.join(", ")}]` : "";
  const label =
    `${character.name} — ${COMBAT_PROFICIENCY_LABEL[profId]} (Força ${rank})${virtueTxt}` +
    torHopeLabel(hopeBonusDice) +
    (opts.supported ? " [Apoio +1d]" : "");
  return { outcome, message: formatTorRollMessage(label, outcome) };
}
