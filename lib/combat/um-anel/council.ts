/**
 * Motor de Conselho do Um Anel (D28 do PRD v2.0) — o encontro social.
 *
 * Regras: livros/um-anel/compendio/conselho.md (fonte da verdade, D15) —
 * extraídas de livros/um-anel/06-fases-de-aventura-combate.md §"Council".
 *
 * Terceiro pilar do jogo, ao lado de Combate e Jornada. Funções puras.
 */

/* ══════════════════════════════════════════════════════════════════════
   Resistência (CON-001…003)
   ══════════════════════════════════════════════════════════════════════ */

export const TOR_COUNCIL_RESISTANCES = [3, 6, 9] as const;
export type TorCouncilResistance = (typeof TOR_COUNCIL_RESISTANCES)[number];

export type TorResistanceMeta = {
  value: TorCouncilResistance;
  label: string;
  description: string;
};

export const TOR_RESISTANCE_META: Record<TorCouncilResistance, TorResistanceMeta> = {
  3: {
    value: 3,
    label: "Pedido razoável",
    description:
      "O povo encontrado não perde nada ao ajudar, ou a Companhia oferece algo equivalente em troca.",
  },
  6: {
    value: 6,
    label: "Pedido ousado",
    description: "O objetivo beneficia a Companhia mais do que beneficia quem foi encontrado.",
  },
  9: {
    value: 9,
    label: "Pedido ultrajante",
    description:
      "A Companhia pede algo perigoso, ou com pouca ou nenhuma possibilidade de recompensa.",
  },
};

export function isTorCouncilResistance(v: number): v is TorCouncilResistance {
  return (TOR_COUNCIL_RESISTANCES as readonly number[]).includes(v);
}

/* ══════════════════════════════════════════════════════════════════════
   Perícias por etapa
   ══════════════════════════════════════════════════════════════════════ */

/** Perícias úteis na Introdução (CON-P01…P03). */
export const TOR_INTRODUCTION_SKILLS = ["imponencia", "cortesia", "enigma"] as const;

/** Perícias úteis na Interação (CON-P03…P07). */
export const TOR_INTERACTION_SKILLS = [
  "encorajar",
  "perspicacia",
  "persuasao",
  "enigma",
  "canto",
] as const;

/* ══════════════════════════════════════════════════════════════════════
   Introdução (CON-S02)
   ══════════════════════════════════════════════════════════════════════ */

export type TorIntroductionResult = {
  /** Tentativas que a Companhia tem como grupo antes de ser dispensada. */
  timeLimit: number;
  passed: boolean;
  /**
   * Falha na Introdução: se o conselho terminar em falha, termina em **Desastre**.
   * Não é "falhou agora" — é uma condição carregada para o fim.
   */
  disasterOnFailure: boolean;
};

/**
 * O limite de tempo sai da rolagem do porta-voz:
 * - sucesso → Resistência + 1 por ícone de Sucesso
 * - falha  → Resistência, e o conselho passa a arriscar Desastre
 */
export function resolveTorIntroduction(opts: {
  resistance: TorCouncilResistance;
  passed: boolean;
  successIcons: number;
}): TorIntroductionResult {
  const bonus = opts.passed ? Math.max(0, opts.successIcons) : 0;
  return {
    timeLimit: opts.resistance + bonus,
    passed: opts.passed,
    disasterOnFailure: !opts.passed,
  };
}

/* ══════════════════════════════════════════════════════════════════════
   Interação (CON-S03)
   ══════════════════════════════════════════════════════════════════════ */

export type TorCouncilState = {
  resistance: TorCouncilResistance;
  timeLimit: number;
  disasterOnFailure: boolean;
  /** Sucessos acumulados até agora. */
  successes: number;
  /** Tentativas já gastas. */
  attemptsUsed: number;
};

export function startTorCouncil(
  resistance: TorCouncilResistance,
  intro: TorIntroductionResult
): TorCouncilState {
  return {
    resistance,
    timeLimit: intro.timeLimit,
    disasterOnFailure: intro.disasterOnFailure,
    successes: 0,
    attemptsUsed: 0,
  };
}

export type TorCouncilOutcome = "ongoing" | "success" | "failure" | "disaster";

export type TorInteractionResult = {
  state: TorCouncilState;
  outcome: TorCouncilOutcome;
  /** Sucessos somados nesta tentativa. */
  gained: number;
  attemptsLeft: number;
};

/**
 * Uma tentativa de Interação. Cada rolagem bem-sucedida acumula 1 sucesso + 1 por
 * ícone; o conselho é ganho quando os sucessos igualam ou passam a Resistência.
 *
 * A tentativa é contada mesmo na falha — é o que faz o limite de tempo apertar.
 */
export function resolveTorInteraction(
  state: TorCouncilState,
  roll: { passed: boolean; successIcons: number }
): TorInteractionResult {
  const gained = roll.passed ? 1 + Math.max(0, roll.successIcons) : 0;
  const next: TorCouncilState = {
    ...state,
    successes: state.successes + gained,
    attemptsUsed: state.attemptsUsed + 1,
  };

  const attemptsLeft = Math.max(0, next.timeLimit - next.attemptsUsed);
  return { state: next, gained, attemptsLeft, outcome: torCouncilOutcome(next) };
}

/**
 * Resultado corrente. A ordem importa: alcançar a Resistência vence mesmo na
 * última tentativa — só depois de esgotar o limite SEM alcançar é que falha.
 */
export function torCouncilOutcome(state: TorCouncilState): TorCouncilOutcome {
  if (state.successes >= state.resistance) return "success";
  if (state.attemptsUsed >= state.timeLimit) {
    return state.disasterOnFailure ? "disaster" : "failure";
  }
  return "ongoing";
}

/* ══════════════════════════════════════════════════════════════════════
   Mensagens
   ══════════════════════════════════════════════════════════════════════ */

const OUTCOME_LABEL: Record<TorCouncilOutcome, string> = {
  ongoing: "em andamento",
  success: "CONSELHO GANHO",
  failure: "conselho falhou",
  disaster: "DESASTRE",
};

export function formatTorIntroductionMessage(
  spokespersonName: string,
  skillLabel: string,
  result: TorIntroductionResult
): string {
  const parts = [
    `${spokespersonName} apresenta a Companhia (${skillLabel}): ${
      result.passed ? "sucesso" : "falha"
    }`,
    `limite de tempo ${result.timeLimit} tentativa${result.timeLimit === 1 ? "" : "s"}`,
  ];
  if (result.disasterOnFailure) {
    parts.push("se o conselho falhar, termina em Desastre");
  }
  return parts.join(" · ");
}

export function formatTorInteractionMessage(
  heroName: string,
  skillLabel: string,
  result: TorInteractionResult
): string {
  const { state, gained, attemptsLeft, outcome } = result;
  const parts = [
    `${heroName} (${skillLabel}): ${gained > 0 ? `+${gained} sucesso` : "sem sucesso"}`,
    `${state.successes}/${state.resistance}`,
    `${attemptsLeft} tentativa${attemptsLeft === 1 ? "" : "s"} restante${attemptsLeft === 1 ? "" : "s"}`,
  ];
  if (outcome !== "ongoing") parts.push(OUTCOME_LABEL[outcome]);
  return parts.join(" · ");
}
