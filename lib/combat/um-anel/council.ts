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

/**
 * Atitude da audiência (06-fases-de-aventura-combate.md §Conselho).
 *
 * "As rolagens de Perícia são modificadas pela atitude das pessoas que
 * encontram" — vale para **todas** as rolagens do Conselho, não só a
 * Introdução. É Dado de SUCESSO, então soma ao rank; Aberta é o padrão e não
 * modifica nada.
 *
 * Duas Virtudes Culturais dependem disto existir: "Amigável e Familiar" ("o povo
 * encontrado é sempre considerado Amigável") e "Amigo dos Anões" ("Anões são
 * sempre considerados Amigáveis num Conselho").
 */
export const TOR_COUNCIL_ATTITUDES = ["relutante", "aberta", "amigavel"] as const;
export type TorCouncilAttitude = (typeof TOR_COUNCIL_ATTITUDES)[number];

export const TOR_COUNCIL_ATTITUDE_META: Record<
  TorCouncilAttitude,
  { id: TorCouncilAttitude; label: string; diceDelta: number; description: string }
> = {
  relutante: {
    id: "relutante",
    label: "Relutante",
    diceDelta: -1,
    description:
      "O grupo encontrado tem razões para não querer ajudar a Companhia — preconceito ou outra preocupação.",
  },
  aberta: {
    id: "aberta",
    label: "Aberta",
    diceDelta: 0,
    description: "Atitude padrão: inclinação geral a ouvir o que a Companhia tem a dizer.",
  },
  amigavel: {
    id: "amigavel",
    label: "Amigável",
    diceDelta: 1,
    description: "A audiência está interessada e disposta a escutar o apelo dos heróis.",
  },
};

export function isTorCouncilAttitude(v: unknown): v is TorCouncilAttitude {
  return typeof v === "string" && (TOR_COUNCIL_ATTITUDES as readonly string[]).includes(v);
}

/** Dados de Sucesso que a atitude soma (ou tira) de cada rolagem do Conselho. */
export function torCouncilAttitudeDice(attitude: TorCouncilAttitude | undefined): number {
  return TOR_COUNCIL_ATTITUDE_META[attitude ?? "aberta"].diceDelta;
}

export type TorCouncilState = {
  resistance: TorCouncilResistance;
  /** Atitude da audiência — ausente é Aberta, que é neutra. */
  attitude?: TorCouncilAttitude;
  timeLimit: number;
  disasterOnFailure: boolean;
  /** Sucessos acumulados até agora. */
  successes: number;
  /** Tentativas já gastas. */
  attemptsUsed: number;
};

export function startTorCouncil(
  resistance: TorCouncilResistance,
  intro: TorIntroductionResult,
  attitude: TorCouncilAttitude = "aberta"
): TorCouncilState {
  return {
    resistance,
    attitude,
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
    // O livro dá DOIS gatilhos independentes pro Desastre:
    //
    // > "DESASTRE: os heróis-jogadores fracassam em todas as rolagens
    // > disponíveis, OU obtêm um número de rolagens bem-sucedidas mas não
    // > conseguem igualar a Resistência após uma Introdução malfeita"
    // > (06-fases-de-aventura-combate.md)
    //
    // Só o segundo estava implementado. Uma Companhia que abre BEM o conselho
    // (Introdução com sucesso, logo `disasterOnFailure` falso) e depois falha em
    // TODAS as tentativas caía em "failure" — o livro manda Desastre, porque
    // zero sucesso é o pior desfecho possível, independente da Introdução.
    if (state.successes === 0) return "disaster";
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
