/**
 * Fontes de Dano fora do combate (08-mestre-e-adversarios.md §"Fontes de Dano").
 *
 * Sistema inteiro que não tinha chegado ao motor: Frio Extremo, Queda, Fogo,
 * Asfixia e **Veneno**. "Afogar-se nas águas glaciais de um lago ou respirar
 * vapores nocivos que emergem de uma tumba antiga pode matar um aventureiro tão
 * bem quanto um incêndio furioso" — e nada disso existia no app.
 *
 * ATENÇÃO à inversão: nesta tabela o Dado de Proeza é lido **ao contrário** do
 * resto do jogo.
 *
 * | Dado de Proeza | O herói está… | Efeito                      |
 * |----------------|---------------|-----------------------------|
 * | Olho           | Desacordado   | reduzido a ZERO             |
 * | 1–10           | Machucado     | perde o resultado numérico  |
 * | Runa           | Ileso         | sai incólume                |
 *
 * Logo **Favorecida ajuda o herói** (mais chance de Runa) e Desfavorecida o
 * afunda — o oposto do que a intuição diz de uma "rolagem de dano". É por isso
 * que a perda **moderada** rola Favorecida e a **gravíssima** rola Desfavorecida.
 * Trocar os dois faria o dano leve doer mais que o mortal.
 *
 * Funções puras, sem import de runtime.
 */

/* ══════════════════════════════════════════════════════════════════════
   Níveis de perda
   ══════════════════════════════════════════════════════════════════════ */

export const TOR_HAZARD_LEVELS = ["moderado", "severo", "gravissimo"] as const;
export type TorHazardLevel = (typeof TOR_HAZARD_LEVELS)[number];

export type TorHazardFeatRoll = "favoured" | "normal" | "illFavoured";

export const TOR_HAZARD_LEVEL_META: Record<
  TorHazardLevel,
  { id: TorHazardLevel; label: string; featRoll: TorHazardFeatRoll; description: string }
> = {
  moderado: {
    id: "moderado",
    label: "Moderado",
    featRoll: "favoured",
    description:
      "Favorecida — dois Dados de Proeza, fica o melhor. Na tabela de Perda de Resistência o melhor é a Runa (Ileso).",
  },
  severo: {
    id: "severo",
    label: "Severo",
    featRoll: "normal",
    description: "Um Dado de Proeza, sem modificador.",
  },
  gravissimo: {
    id: "gravissimo",
    label: "Gravíssimo",
    featRoll: "illFavoured",
    description: "Desfavorecida — dois Dados de Proeza, fica o pior. O pior é o Olho (zero).",
  },
};

export function isTorHazardLevel(v: unknown): v is TorHazardLevel {
  return typeof v === "string" && (TOR_HAZARD_LEVELS as readonly string[]).includes(v);
}

/* ══════════════════════════════════════════════════════════════════════
   Fontes
   ══════════════════════════════════════════════════════════════════════ */

export const TOR_HAZARD_SOURCES = ["frio", "queda", "fogo", "asfixia", "veneno"] as const;
export type TorHazardSource = (typeof TOR_HAZARD_SOURCES)[number];

/** O que acontece com o herói que chega a zero de Resistência por esta fonte. */
export type TorHazardZeroEffect = "morrendo" | "ferido";

export type TorHazardSourceMeta = {
  id: TorHazardSource;
  label: string;
  /** Com que frequência o livro manda rolar. */
  cadence: string;
  /**
   * Zero de Resistência já derruba inconsciente por regra geral (capítulo 6);
   * a tabela de Fontes de Dano diz o que essa fonte acrescenta.
   */
  atZero: TorHazardZeroEffect;
  /** Exemplos do livro, por nível. */
  examples: Record<TorHazardLevel, string>;
};

export const TOR_HAZARD_SOURCE_META: Record<TorHazardSource, TorHazardSourceMeta> = {
  frio: {
    id: "frio",
    label: "Frio Extremo",
    cadence: "a cada meia hora",
    atZero: "morrendo",
    examples: {
      moderado: "Ventos glaciais",
      severo: "Neve profunda",
      gravissimo: "Águas geladas",
    },
  },
  queda: {
    id: "queda",
    label: "Queda",
    cadence: "por queda",
    atZero: "ferido",
    examples: {
      moderado: "Queda curta (até 10 pés, ou aterrissagem macia)",
      severo: "Queda longa (até 30 pés, ou aterrissagem dura)",
      gravissimo: "Queda mortal (grande altura, ou aterrissagem perigosa)",
    },
  },
  fogo: {
    id: "fogo",
    label: "Fogo",
    cadence: "a cada rodada",
    atZero: "ferido",
    examples: {
      moderado: "Chama de tocha, fogueira",
      severo: "Braseiro, casa em chamas",
      gravissimo: "Pira funerária, fogo de Dragão",
    },
  },
  asfixia: {
    id: "asfixia",
    label: "Asfixia",
    cadence: "a cada rodada",
    atZero: "morrendo",
    examples: {
      moderado: "Vapores asfixiantes",
      severo: "Afogamento",
      gravissimo: "Estrangulamento",
    },
  },
  veneno: {
    id: "veneno",
    label: "Veneno",
    cadence: "ao fim de cada dia",
    atZero: "morrendo",
    examples: {
      moderado: "Intoxicação alimentar",
      severo: "Mordida de serpente, veneno de Orc",
      gravissimo: "Veneno de Aranha",
    },
  },
};

export function isTorHazardSource(v: unknown): v is TorHazardSource {
  return typeof v === "string" && (TOR_HAZARD_SOURCES as readonly string[]).includes(v);
}

/* ══════════════════════════════════════════════════════════════════════
   Resolução
   ══════════════════════════════════════════════════════════════════════ */

export type TorHazardOutcome = {
  source: TorHazardSource;
  level: TorHazardLevel;
  /** Resistência perdida. Zero quando Ileso **ou** quando foi reduzido a zero. */
  loss: number;
  /** Olho — "é reduzido a zero de Resistência", não "perde 0". */
  reducedToZero: boolean;
  /** Runa de Gandalf — sai incólume. */
  unharmed: boolean;
  /** O que a fonte acrescenta se o herói chegar a zero. */
  atZero: TorHazardZeroEffect;
  /** Veneno: a Runa também **cura**. */
  poisonCured: boolean;
};

/**
 * Lê o Dado de Proeza na tabela de Perda de Resistência.
 *
 * `reducedToZero` é separado de `loss` de propósito: o Olho não é "perder zero"
 * nem "perder 10" — é ir a zero venha de onde vier a Resistência atual. Guardar
 * como número obrigaria o chamador a saber a Resistência para converter, e é
 * exatamente aí que a regra se perderia.
 */
export function resolveTorHazard(opts: {
  source: TorHazardSource;
  level: TorHazardLevel;
  featDie: { kind: "number" | "eye" | "gandalf"; numeric: number };
}): TorHazardOutcome {
  const { source, level, featDie } = opts;
  const unharmed = featDie.kind === "gandalf";
  const reducedToZero = featDie.kind === "eye";

  return {
    source,
    level,
    loss: unharmed || reducedToZero ? 0 : Math.max(0, featDie.numeric),
    reducedToZero,
    unharmed,
    atZero: TOR_HAZARD_SOURCE_META[source].atZero,
    // "se a rolagem produzir um ᛥ, o herói não sofre dano e não está mais
    // envenenado" — a Runa é o ÚNICO resultado que cura pela própria rolagem.
    poisonCured: source === "veneno" && unharmed,
  };
}

/* ══════════════════════════════════════════════════════════════════════
   Veneno
   ══════════════════════════════════════════════════════════════════════ */

/**
 * "Uma rolagem bem-sucedida de CURA feita no início de um dia também remove os
 * efeitos do veneno — a rolagem *perde (1d)* se o veneno é Severo, e *perde (2d)*
 * se é Gravíssimo."
 *
 * São Dados de SUCESSO perdidos, não Desfavorecida: entram como `bonusDice`
 * negativo, que soma e tem piso em zero. Virar Desfavorecida seria pior e
 * diferente — ela se cancela com Favorecida, o dado de Sucesso não.
 */
export function torPoisonHealingPenalty(level: TorHazardLevel): number {
  if (level === "gravissimo") return 2;
  if (level === "severo") return 1;
  return 0;
}

/* ══════════════════════════════════════════════════════════════════════
   Mensagens
   ══════════════════════════════════════════════════════════════════════ */

export function formatTorHazardMessage(
  heroName: string,
  outcome: TorHazardOutcome,
  after: { endurance: number }
): string {
  const meta = TOR_HAZARD_SOURCE_META[outcome.source];
  const nivel = TOR_HAZARD_LEVEL_META[outcome.level].label;
  const cabecalho = `${heroName} — ${meta.label} (${nivel})`;

  if (outcome.unharmed) {
    return (
      `${cabecalho}: Ileso` + (outcome.poisonCured ? " · o veneno passou — não está mais envenenado" : "")
    );
  }
  if (outcome.reducedToZero) {
    return (
      `${cabecalho}: Desacordado — Resistência reduzida a zero` +
      (outcome.atZero === "morrendo" ? " · está MORRENDO" : " · fica FERIDO")
    );
  }
  return (
    `${cabecalho}: Machucado — perde ${outcome.loss} de Resistência (agora ${after.endurance})` +
    (after.endurance <= 0
      ? outcome.atZero === "morrendo"
        ? " · chegou a zero: está MORRENDO"
        : " · chegou a zero: fica FERIDO"
      : "")
  );
}
