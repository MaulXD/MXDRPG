/**
 * Motor de progressão e Fase de Companhia do Um Anel (D29 do PRD v2.0).
 *
 * Regras: livros/um-anel/compendio/progressao.md (fonte da verdade, D15) —
 * extraídas de livros/um-anel/07-fases-de-companhia-jornada.md §"Perform Updates",
 * §"Yule" e §"Choose Undertakings", e de 05-valor-e-sabedoria.md.
 *
 * Funções puras. Sombra e Fadiga são delegadas a shadow.ts; aqui só entram XP,
 * Valor/Sabedoria, Empreitadas, calendário e Nível de Companhia.
 */

import {
  applyTorShadowGain,
  type TorSpiritState,
  type TorSpiritFlags,
  deriveTorSpiritFlags,
} from "@/lib/combat/um-anel/shadow";

/* ══════════════════════════════════════════════════════════════════════
   Custos de Experiência
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Custo para ATINGIR um novo nível. O índice é o nível alvo (1–6).
 * Perícias e Proficiências de Combate usam a mesma tabela; Valor e Sabedoria
 * só existem de 2 a 6 (começam em 1 na criação, sem custo).
 */
export const TOR_XP_COST_BY_LEVEL: Record<number, number> = {
  1: 4,
  2: 8,
  3: 12,
  4: 20,
  5: 26,
  6: 30,
};

export const TOR_MAX_RATING = 6;

export type TorXpPurchase = { ok: false; reason: string } | { ok: true; cost: number; newLevel: number };

/**
 * Perícias gastam **pontos de Perícia**; Proficiências, Valor e Sabedoria gastam
 * **pontos de Aventura**. São bolsos separados — misturar é o erro clássico.
 */
export function priceTorSkillRank(current: number, availableSkillPoints: number): TorXpPurchase {
  const target = current + 1;
  if (target > TOR_MAX_RATING) {
    return { ok: false, reason: `Perícia já está no máximo (${TOR_MAX_RATING})` };
  }
  const cost = TOR_XP_COST_BY_LEVEL[target];
  if (availableSkillPoints < cost) {
    return { ok: false, reason: `Faltam ${cost - availableSkillPoints} pontos de Perícia` };
  }
  return { ok: true, cost, newLevel: target };
}

export function priceTorProficiencyRank(
  current: number,
  availableAdventurePoints: number
): TorXpPurchase {
  const target = current + 1;
  if (target > TOR_MAX_RATING) {
    return { ok: false, reason: `Proficiência já está no máximo (${TOR_MAX_RATING})` };
  }
  const cost = TOR_XP_COST_BY_LEVEL[target];
  if (availableAdventurePoints < cost) {
    return { ok: false, reason: `Faltam ${cost - availableAdventurePoints} pontos de Aventura` };
  }
  return { ok: true, cost, newLevel: target };
}

export function priceTorValourOrWisdomRank(
  current: number,
  availableAdventurePoints: number
): TorXpPurchase {
  const target = current + 1;
  if (target > TOR_MAX_RATING) {
    return { ok: false, reason: `Já está no máximo (${TOR_MAX_RATING})` };
  }
  // Valor/Sabedoria começam em 1 na criação — o primeiro degrau comprável é o 2.
  if (target < 2) {
    return { ok: false, reason: "Valor e Sabedoria começam em 1 na criação" };
  }
  const cost = TOR_XP_COST_BY_LEVEL[target];
  if (availableAdventurePoints < cost) {
    return { ok: false, reason: `Faltam ${cost - availableAdventurePoints} pontos de Aventura` };
  }
  return { ok: true, cost, newLevel: target };
}

/* ══════════════════════════════════════════════════════════════════════
   Limites por Fase de Companhia
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Estado do que já foi comprado nesta Fase. O livro limita: 1 grau por Perícia,
 * 1 grau por Proficiência, e **Valor OU Sabedoria, nunca os dois**.
 */
export type TorPhasePurchases = {
  skillRanks: Record<string, number>;
  proficiencyRanks: Record<string, number>;
  boughtValour: boolean;
  boughtWisdom: boolean;
};

export function emptyTorPhasePurchases(): TorPhasePurchases {
  return { skillRanks: {}, proficiencyRanks: {}, boughtValour: false, boughtWisdom: false };
}

export type TorPhaseLimitCheck = { ok: true } | { ok: false; reason: string };

export function canBuyTorSkillThisPhase(
  purchases: TorPhasePurchases,
  skillId: string
): TorPhaseLimitCheck {
  if ((purchases.skillRanks[skillId] ?? 0) >= 1) {
    return { ok: false, reason: "Máximo de 1 grau por Perícia em cada Fase de Companhia" };
  }
  return { ok: true };
}

export function canBuyTorProficiencyThisPhase(
  purchases: TorPhasePurchases,
  proficiencyId: string
): TorPhaseLimitCheck {
  if ((purchases.proficiencyRanks[proficiencyId] ?? 0) >= 1) {
    return { ok: false, reason: "Máximo de 1 grau por Proficiência em cada Fase de Companhia" };
  }
  return { ok: true };
}

/**
 * Valor e Sabedoria competem entre si: só um dos dois por Fase. Não recebe
 * `which` de propósito — comprar qualquer um dos dois bloqueia os dois, então o
 * parâmetro seria decorativo e sugeriria uma checagem por eixo que não existe.
 */
export function canBuyTorValourOrWisdomThisPhase(
  purchases: TorPhasePurchases
): TorPhaseLimitCheck {
  if (purchases.boughtValour || purchases.boughtWisdom) {
    const already = purchases.boughtValour ? "Valor" : "Sabedoria";
    return {
      ok: false,
      reason: `Já comprou ${already} nesta Fase — Valor e Sabedoria não podem ambos subir na mesma Fase`,
    };
  }
  return { ok: true };
}

/* ══════════════════════════════════════════════════════════════════════
   Recompensa por novo grau (Valor → Recompensa, Sabedoria → Virtude)
   ══════════════════════════════════════════════════════════════════════ */

export type TorRankGrant = { kind: "reward" } | { kind: "virtue"; culturalAllowed: boolean };

/**
 * Novo grau de Valor concede uma Recompensa; de Sabedoria, uma Virtude.
 * Virtudes Culturais só a partir de Sabedoria 2, e só da própria Cultura.
 */
export function torRankGrant(which: "valour" | "wisdom", newRank: number): TorRankGrant {
  if (which === "valour") return { kind: "reward" };
  return { kind: "virtue", culturalAllowed: newRank >= 2 };
}

/* ══════════════════════════════════════════════════════════════════════
   Recuperação espiritual da Fase (§Spiritual Recovery)
   ══════════════════════════════════════════════════════════════════════ */

/** Quanto a Companhia atrapalhou a Sombra na Fase de Aventura que passou. */
export const TOR_PHASE_OUTCOMES = ["nenhum", "marginal", "ativo", "notavel"] as const;
export type TorPhaseOutcome = (typeof TOR_PHASE_OUTCOMES)[number];

/** Máximo de Sombra removida por resultado da Fase de Aventura. */
export const TOR_SHADOW_RELIEF: Record<TorPhaseOutcome, number> = {
  nenhum: 0,
  marginal: 1,
  ativo: 2,
  notavel: 3,
};

export type TorSpiritualRecoveryResult = {
  hopeRecovered: number;
  shadowRemoved: number;
  state: TorSpiritState;
  flags: TorSpiritFlags;
};

/**
 * Recuperação automática da Fase de Companhia:
 * - Esperança: +Coração; numa Fase de Yule recupera **tudo**.
 * - Sombra: 1 a 3 pontos, conforme o resultado da Fase de Aventura.
 *
 * Cicatrizes NÃO saem aqui — só pela Empreitada Curar Cicatrizes, em Yule.
 */
export function applyTorSpiritualRecovery(
  state: TorSpiritState,
  opts: { heartScore: number; isYule: boolean; outcome: TorPhaseOutcome; shadowReliefUsed?: number }
): TorSpiritualRecoveryResult {
  const hopeRoom = Math.max(0, state.hopeMax - state.hopeValue);
  const hopeRecovered = opts.isYule ? hopeRoom : Math.min(hopeRoom, Math.max(0, opts.heartScore));

  const cap = TOR_SHADOW_RELIEF[opts.outcome];
  const requested = opts.shadowReliefUsed ?? cap;
  const shadowRemoved = Math.min(state.shadow, Math.max(0, Math.min(cap, requested)));

  const next: TorSpiritState = {
    ...state,
    hopeValue: state.hopeValue + hopeRecovered,
    shadow: state.shadow - shadowRemoved,
  };

  return { hopeRecovered, shadowRemoved, state: next, flags: deriveTorSpiritFlags(next) };
}

/* ══════════════════════════════════════════════════════════════════════
   Yule e calendário
   ══════════════════════════════════════════════════════════════════════ */

/** Yule chega aproximadamente a cada 3 Fases de Companhia. */
export const TOR_PHASES_PER_YEAR = 3;

export type TorCalendar = {
  year: number;
  /** Fases já cumpridas no ano corrente (0 a 3). */
  phasesThisYear: number;
};

export type TorAdvanceCalendarResult = {
  calendar: TorCalendar;
  isYule: boolean;
  /** Todos envelhecem 1 ano no Yule. */
  yearsAged: number;
  /** Bônus de pontos de Perícia igual à Astúcia, só em Yule. */
  bonusSkillPoints: number;
};

/**
 * Avança o calendário uma Fase de Companhia. A terceira Fase do ano é Yule:
 * vira o ano, todos envelhecem e ganham pontos de Perícia iguais à Astúcia.
 */
export function advanceTorCalendar(
  calendar: TorCalendar,
  opts: { witsScore: number }
): TorAdvanceCalendarResult {
  const nextCount = calendar.phasesThisYear + 1;
  const isYule = nextCount >= TOR_PHASES_PER_YEAR;

  return {
    calendar: isYule
      ? { year: calendar.year + 1, phasesThisYear: 0 }
      : { year: calendar.year, phasesThisYear: nextCount },
    isYule,
    yearsAged: isYule ? 1 : 0,
    bonusSkillPoints: isYule ? Math.max(0, opts.witsScore) : 0,
  };
}

/* ══════════════════════════════════════════════════════════════════════
   Empreitadas (§Choose Undertakings)
   ══════════════════════════════════════════════════════════════════════ */

export type TorUndertakingBudget = {
  /** Escolhas base: 1 na Fase comum, 1 por herói no Yule. */
  base: number;
  /** 1 extra entre as marcadas como grátis pelo Chamado presente na Companhia. */
  free: number;
  total: number;
};

/**
 * Fase comum: a Companhia escolhe 1 (máximo 2 com a grátis).
 * Yule: cada jogador escolhe 1 (máximo heróis + 1).
 */
export function torUndertakingBudget(opts: {
  isYule: boolean;
  companySize: number;
}): TorUndertakingBudget {
  const base = opts.isYule ? Math.max(1, opts.companySize) : 1;
  const free = 1;
  return { base, free, total: base + free };
}

export type TorUndertakingPick = { id: string; yuleOnly: boolean };

export type TorUndertakingValidation = { ok: true } | { ok: false; reason: string };

/**
 * Empreitadas escolhidas precisam ser diferentes entre si — exceto as marcadas
 * como (Yule), que podem ser escolhidas por vários heróis.
 */
export function validateTorUndertakings(
  picks: TorUndertakingPick[],
  opts: { isYule: boolean; companySize: number }
): TorUndertakingValidation {
  const budget = torUndertakingBudget(opts);
  if (picks.length > budget.total) {
    return {
      ok: false,
      reason: `Máximo de ${budget.total} Empreitadas nesta Fase (escolheu ${picks.length})`,
    };
  }

  const yuleOnly = picks.filter((p) => p.yuleOnly);
  if (!opts.isYule && yuleOnly.length > 0) {
    return {
      ok: false,
      reason: `${yuleOnly.map((p) => p.id).join(", ")} só pode ser escolhida numa Fase de Yule`,
    };
  }

  // Duplicatas só são permitidas em Empreitadas de Yule.
  const seen = new Set<string>();
  for (const p of picks) {
    if (p.yuleOnly) continue;
    if (seen.has(p.id)) {
      return { ok: false, reason: `Empreitada repetida: ${p.id}` };
    }
    seen.add(p.id);
  }

  return { ok: true };
}

/* ══════════════════════════════════════════════════════════════════════
   Nível de Companhia e Patrono
   ══════════════════════════════════════════════════════════════════════ */

/**
 * O Patrono principal soma seu bônus ao Nível de Companhia. Sem Patrono o nível
 * é o base — nunca negativo.
 */
export function torFellowshipLevel(opts: {
  baseLevel: number;
  patronBonus?: number;
}): number {
  return Math.max(0, opts.baseLevel + Math.max(0, opts.patronBonus ?? 0));
}

/* ══════════════════════════════════════════════════════════════════════
   Crónica
   ══════════════════════════════════════════════════════════════════════ */

export type TorChronicleEntry = {
  year: number;
  phase: number;
  isYule: boolean;
  /** Empreitadas realizadas. */
  undertakings: string[];
  /** Resultado da Fase de Aventura que precedeu. */
  outcome: TorPhaseOutcome;
  /** Texto livre do Mestre. */
  note?: string;
};

export function appendTorChronicle(
  chronicle: TorChronicleEntry[],
  entry: TorChronicleEntry
): TorChronicleEntry[] {
  return [...chronicle, entry];
}

/* ══════════════════════════════════════════════════════════════════════
   Mensagens
   ══════════════════════════════════════════════════════════════════════ */

const OUTCOME_LABEL: Record<TorPhaseOutcome, string> = {
  nenhum: "sem efeito contra a Sombra",
  marginal: "atrapalhou marginalmente a Sombra",
  ativo: "atrapalhou ou feriu o Inimigo",
  notavel: "feito digno da atenção do Senhor Sombrio",
};

export function formatTorSpiritualRecoveryMessage(
  heroName: string,
  opts: { isYule: boolean; outcome: TorPhaseOutcome },
  result: TorSpiritualRecoveryResult
): string {
  const parts = [`${heroName} — Fase de Companhia${opts.isYule ? " (Yule)" : ""}`];
  if (result.hopeRecovered > 0) parts.push(`+${result.hopeRecovered} Esperança`);
  if (result.shadowRemoved > 0) {
    parts.push(`−${result.shadowRemoved} Sombra (${OUTCOME_LABEL[opts.outcome]})`);
  }
  parts.push(
    `Esperança ${result.state.hopeValue}/${result.state.hopeMax} · Sombra ${result.state.shadow}+${result.state.shadowScars}`
  );
  if (result.flags.miserable) parts.push("ainda MISERÁVEL");
  return parts.join(" · ");
}

export function formatTorCalendarMessage(result: TorAdvanceCalendarResult): string {
  if (!result.isYule) {
    return `Fase de Companhia ${result.calendar.phasesThisYear}/${TOR_PHASES_PER_YEAR} do ano ${result.calendar.year}`;
  }
  return `YULE — o ano vira para ${result.calendar.year}, todos envelhecem 1 ano e ganham ${result.bonusSkillPoints} pontos de Perícia (Astúcia)`;
}

/** Reexport para quem orquestra a Fase inteira num só lugar. */
export { applyTorShadowGain };
