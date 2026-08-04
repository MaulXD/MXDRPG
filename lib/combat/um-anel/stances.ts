/**
 * Posturas de combate do Um Anel (D17 do PRD v2.0).
 *
 * Regras: livros/um-anel/compendio/posturas.md (fonte da verdade, D15) —
 * extraídas de livros/um-anel/06-fases-de-aventura-combate.md §"1 — Stances".
 *
 * Por que existe em TS além do compêndio: o markdown/JSON é a versão *navegável*
 * (texto para o jogador ler); aqui ficam os números que o servidor aplica na
 * rolagem. Mesmo par que o Eldarin usa entre `data/compendiums/habilidades.json`
 * e `lib/combat/pa-economy.ts`.
 *
 * Notação do livro: "(1d)" é **Dado de Sucesso** (d6), não Dado de Proeza —
 * então postura mexe em `rank`, nunca em favoured/illFavoured.
 */

export const TOR_STANCES = ["avancada", "aberta", "defensiva", "retaguarda"] as const;
export type TorStanceId = (typeof TOR_STANCES)[number];

export const TOR_DEFAULT_STANCE: TorStanceId = "aberta";

export type TorStanceMeta = {
  id: TorStanceId;
  label: string;
  /** Alcance permitido para atacar nesta postura. */
  range: "close" | "ranged";
  /** Dados de Sucesso somados ao próprio ataque. */
  attackRankDelta: number;
  /**
   * Dados de Sucesso somados a quem ataca você em corpo a corpo.
   * Positivo = mais fácil te acertar.
   */
  incomingCloseRankDelta: number;
  /** Perde 1 Dado de Sucesso por oponente que engaja (só Defensiva). */
  attackRankPerEngager: number;
  combatTask: string;
};

export const TOR_STANCE_META: Record<TorStanceId, TorStanceMeta> = {
  avancada: {
    id: "avancada",
    label: "Avançada",
    range: "close",
    attackRankDelta: 1,
    incomingCloseRankDelta: 1,
    attackRankPerEngager: 0,
    combatTask: "Intimidar Inimigo",
  },
  aberta: {
    id: "aberta",
    label: "Aberta",
    range: "close",
    attackRankDelta: 0,
    incomingCloseRankDelta: 0,
    attackRankPerEngager: 0,
    combatTask: "Reunir Companheiros",
  },
  defensiva: {
    id: "defensiva",
    label: "Defensiva",
    range: "close",
    attackRankDelta: 0,
    incomingCloseRankDelta: -1,
    attackRankPerEngager: -1,
    combatTask: "Proteger Companheiro",
  },
  retaguarda: {
    id: "retaguarda",
    label: "Retaguarda",
    range: "ranged",
    attackRankDelta: 0,
    // Não pode ser engajado em corpo a corpo — ver `canBeTargetedBy`.
    incomingCloseRankDelta: 0,
    attackRankPerEngager: 0,
    combatTask: "Preparar Tiro",
  },
};

export function torStanceLabel(id: TorStanceId): string {
  return TOR_STANCE_META[id].label;
}

export function isTorStance(v: unknown): v is TorStanceId {
  return typeof v === "string" && (TOR_STANCES as readonly string[]).includes(v);
}

/** Dados de Sucesso do atacante depois da própria postura e dos engajadores. */
export function attackRankWithStance(
  baseRank: number,
  stance: TorStanceId,
  engagedByCount = 0
): number {
  const meta = TOR_STANCE_META[stance];
  const perEngager = meta.attackRankPerEngager * Math.max(0, engagedByCount);
  return Math.max(0, baseRank + meta.attackRankDelta + perEngager);
}

/** Dados de Sucesso de quem ataca este defensor, conforme a postura dele. */
export function incomingRankWithStance(
  baseRank: number,
  defenderStance: TorStanceId,
  attackIsRanged: boolean
): number {
  // Ataque à distância ignora o modificador de corpo a corpo da postura.
  if (attackIsRanged) return Math.max(0, baseRank);
  const meta = TOR_STANCE_META[defenderStance];
  return Math.max(0, baseRank + meta.incomingCloseRankDelta);
}

export type TorTargetingCheck = { ok: true } | { ok: false; reason: string };

/**
 * Retaguarda só ataca e só é atacada à distância; corpo a corpo não pode
 * alcançar quem está lá. É a regra que impede o arqueiro de virar alvo fácil.
 */
export function canAttackFromStance(
  attackerStance: TorStanceId,
  attackIsRanged: boolean
): TorTargetingCheck {
  const meta = TOR_STANCE_META[attackerStance];
  if (meta.range === "ranged" && !attackIsRanged) {
    return { ok: false, reason: "Em Retaguarda só é possível atacar com armas à distância" };
  }
  if (meta.range === "close" && attackIsRanged) {
    return {
      ok: false,
      reason: "Ataques à distância exigem a postura de Retaguarda depois das saraivadas iniciais",
    };
  }
  return { ok: true };
}

export function canBeTargetedBy(
  defenderStance: TorStanceId,
  attackIsRanged: boolean
): TorTargetingCheck {
  if (defenderStance === "retaguarda" && !attackIsRanged) {
    return {
      ok: false,
      reason: "Alvo está em Retaguarda — só pode ser atingido por armas à distância",
    };
  }
  return { ok: true };
}

/** Limites de engajamento (POS-R03). */
export const TOR_ENGAGEMENT_LIMITS = {
  heroesPerHumanFoe: 3,
  heroesPerLargeFoe: 6,
  humanFoesPerHero: 3,
  largeFoesPerHero: 2,
} as const;

/**
 * Requisito da Retaguarda (POS-R04 do livro): o total de inimigos não pode passar
 * do dobro dos aventureiros, e cada herói em Retaguarda exige dois outros em
 * corpo a corpo. O Mestre pode liberar por terreno (POS-R02) — daí o `override`.
 */
export function canAssumeRearward(opts: {
  companySize: number;
  enemyCount: number;
  heroesInCloseCombat: number;
  heroesAlreadyRearward: number;
  loremasterOverride?: boolean;
}): TorTargetingCheck {
  if (opts.loremasterOverride) return { ok: true };

  if (opts.enemyCount > opts.companySize * 2) {
    return {
      ok: false,
      reason: "Inimigos demais para alguém ficar em Retaguarda (máx. o dobro da Companhia)",
    };
  }
  const needed = (opts.heroesAlreadyRearward + 1) * 2;
  if (opts.heroesInCloseCombat < needed) {
    return {
      ok: false,
      reason: `Retaguarda exige 2 aventureiros em corpo a corpo por herói recuado (faltam ${
        needed - opts.heroesInCloseCombat
      })`,
    };
  }
  return { ok: true };
}
