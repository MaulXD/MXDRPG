/**
 * Motor de Jornada do Um Anel (D21/D23/D24 do PRD v2.0).
 *
 * Regras: livros/um-anel/compendio/jornada.md (fonte da verdade, D15) —
 * extraídas de livros/um-anel/06-fases-de-aventura-combate.md §"Journey".
 *
 * Unidade de distância é o **trecho** (D22 — o livro usa "hex"; a matemática é
 * idêntica, só contagem de unidades ao longo da rota, e o projeto não usa
 * hexágonos em lugar nenhum).
 *
 * Funções puras. A Fadiga e a Sombra que os eventos geram saem daqui como
 * números; quem aplica no herói é lib/combat/um-anel/shadow.ts.
 */

import type { FeatDieRoll } from "@/lib/character/um-anel/dice";

/* ══════════════════════════════════════════════════════════════════════
   Papéis
   ══════════════════════════════════════════════════════════════════════ */

export const TOR_JOURNEY_ROLES = ["guia", "batedor", "olheiro", "cacador"] as const;
export type TorJourneyRole = (typeof TOR_JOURNEY_ROLES)[number];

export type TorJourneyRoleMeta = {
  id: TorJourneyRole;
  label: string;
  /** Perícia usada pelo papel — id de TorSkillId. */
  skillId: string;
  /** Só pode haver um Guia na Companhia. */
  unique: boolean;
};

export const TOR_JOURNEY_ROLE_META: Record<TorJourneyRole, TorJourneyRoleMeta> = {
  guia: { id: "guia", label: "Guia", skillId: "viajar", unique: true },
  batedor: { id: "batedor", label: "Batedor", skillId: "explorar", unique: false },
  olheiro: { id: "olheiro", label: "Olheiro", skillId: "percepcao", unique: false },
  cacador: { id: "cacador", label: "Caçador", skillId: "caca", unique: false },
};

export type TorRoleAssignment = Partial<Record<TorJourneyRole, string[]>>;

export type TorRoleValidation = { ok: true } | { ok: false; reason: string };

/**
 * A Companhia precisa cobrir os quatro papéis. Com menos de quatro heróis alguém
 * acumula função — mas Guia é sempre um só.
 */
export function validateTorRoleAssignment(assignment: TorRoleAssignment): TorRoleValidation {
  const guides = assignment.guia ?? [];
  if (guides.length === 0) return { ok: false, reason: "A Companhia precisa de um Guia" };
  if (guides.length > 1) return { ok: false, reason: "Só pode haver um Guia" };

  const uncovered = TOR_JOURNEY_ROLES.filter((r) => (assignment[r] ?? []).length === 0);
  if (uncovered.length > 0) {
    return {
      ok: false,
      reason: `Papéis sem ninguém: ${uncovered.map((r) => TOR_JOURNEY_ROLE_META[r].label).join(", ")}`,
    };
  }
  return { ok: true };
}

/* ══════════════════════════════════════════════════════════════════════
   Estação, região e terreno
   ══════════════════════════════════════════════════════════════════════ */

export const TOR_SEASONS = ["primavera", "verao", "outono", "inverno"] as const;
export type TorSeason = (typeof TOR_SEASONS)[number];

/** Estação fria encurta a distância até o evento quando o Teste de Marcha falha. */
export function isColdSeason(season: TorSeason): boolean {
  return season === "outono" || season === "inverno";
}

export const TOR_REGION_TYPES = ["fronteirica", "selvagem", "sombria"] as const;
export type TorRegionType = (typeof TOR_REGION_TYPES)[number];

export type TorRegionMeta = {
  id: TorRegionType;
  label: string;
  /** Como o Mestre rola o Dado de Proeza para determinar o evento. */
  featRoll: "favoured" | "normal" | "illFavoured";
};

export const TOR_REGION_META: Record<TorRegionType, TorRegionMeta> = {
  fronteirica: { id: "fronteirica", label: "Terras Fronteiriças", featRoll: "favoured" },
  selvagem: { id: "selvagem", label: "Terras Selvagens", featRoll: "normal" },
  sombria: { id: "sombria", label: "Terras Sombrias", featRoll: "illFavoured" },
};

export const TOR_TERRAIN_TYPES = ["estrada", "normal", "dificil"] as const;
export type TorTerrainType = (typeof TOR_TERRAIN_TYPES)[number];

/**
 * Modificador de terreno na rolagem de quem enfrenta o evento (JOR-M01).
 *
 * O livro dá **Dados de Sucesso**, não Favorecida/Desfavorecida:
 *
 * > "se o evento ocorre em um hexágono que sugira terreno difícil, o
 * > herói-jogador *perde (1d)*. Inversamente, se o evento acontece ao longo de
 * > uma estrada, o herói-jogador *ganha (1d)*." (06-fases-de-aventura-combate.md)
 *
 * E o capítulo 2 separa as duas mecânicas de propósito: "ganha (1d)" soma um
 * Dado de Sucesso, enquanto Favorecida/Desfavorecida rola dois Dados de Proeza.
 *
 * Antes isto devolvia favoured/illFavoured, o que trocava a mecânica e criava um
 * segundo problema: a REGIÃO (Terras Fronteiriças/Selvagens/Sombrias) é que mexe
 * no Dado de Proeza, e Favorecida + Desfavorecida se **cancelam** — então uma
 * estrada em Terras Sombrias anulava a penalidade da Região, algo que o livro
 * nunca diz.
 */
export function terrainRollModifier(terrain: TorTerrainType): { rankDelta: number } {
  if (terrain === "estrada") return { rankDelta: 1 };
  if (terrain === "dificil") return { rankDelta: -1 };
  return { rankDelta: 0 };
}

/* ══════════════════════════════════════════════════════════════════════
   Teste de Marcha (JOR-S02)
   ══════════════════════════════════════════════════════════════════════ */

export type TorMarchingTestInput = {
  passed: boolean;
  successIcons: number;
  season: TorSeason;
  /** Trechos que faltam até o destino. */
  trechosRemaining: number;
};

export type TorMarchingTestResult = {
  /** Trechos avançados até o ponto do evento. */
  distance: number;
  /** A contagem alcançou ou passou o destino — jornada terminou (JOR-S03). */
  arrived: boolean;
  /** Trechos que restam depois deste passo. */
  trechosRemaining: number;
};

export function resolveTorMarchingTest(input: TorMarchingTestInput): TorMarchingTestResult {
  // Falha: 2 trechos em Verão/Primavera, 1 em Inverno/Outono.
  // Sucesso: 3 trechos + 1 por ícone de Sucesso.
  const distance = input.passed
    ? 3 + Math.max(0, input.successIcons)
    : isColdSeason(input.season)
      ? 1
      : 2;

  const arrived = distance >= input.trechosRemaining;
  return {
    distance,
    arrived,
    trechosRemaining: arrived ? 0 : input.trechosRemaining - distance,
  };
}

/* ══════════════════════════════════════════════════════════════════════
   Alvo do evento (JOR-A0x)
   ══════════════════════════════════════════════════════════════════════ */

export type TorEventTarget = { role: TorJourneyRole; skillId: string };

/**
 * Dado de Sucesso (1–6) escolhe quem enfrenta o evento. O Guia nunca é alvo —
 * ele é quem rola o Teste de Marcha.
 */
export function torEventTargetFromRoll(successDie: number): TorEventTarget {
  const role: TorJourneyRole =
    successDie <= 2 ? "batedor" : successDie <= 4 ? "olheiro" : "cacador";
  return { role, skillId: TOR_JOURNEY_ROLE_META[role].skillId };
}

/* ══════════════════════════════════════════════════════════════════════
   Tabela de Eventos (JOR-E0x)
   ══════════════════════════════════════════════════════════════════════ */

export const TOR_JOURNEY_EVENTS = [
  "terrivel-infortunio",
  "desespero",
  "mas-escolhas",
  "contratempo",
  "atalho",
  "encontro-fortuito",
  "visao-alegre",
] as const;
export type TorJourneyEventId = (typeof TOR_JOURNEY_EVENTS)[number];

export type TorJourneyEventMeta = {
  id: TorJourneyEventId;
  label: string;
  /** Fadiga que TODOS na Companhia ganham. */
  fatigue: number;
  /** A consequência dispara no sucesso ou na falha da rolagem do alvo? */
  triggersOn: "failure" | "success";
  consequence: string;
};

export const TOR_JOURNEY_EVENT_META: Record<TorJourneyEventId, TorJourneyEventMeta> = {
  "terrivel-infortunio": {
    id: "terrivel-infortunio",
    label: "Terrível Infortúnio",
    fatigue: 3,
    triggersOn: "failure",
    consequence: "O alvo fica Ferido",
  },
  desespero: {
    id: "desespero",
    label: "Desespero",
    fatigue: 2,
    triggersOn: "failure",
    consequence: "Todos na Companhia ganham 1 ponto de Sombra (Pavor)",
  },
  "mas-escolhas": {
    id: "mas-escolhas",
    label: "Más Escolhas",
    fatigue: 2,
    triggersOn: "failure",
    consequence: "O alvo ganha 1 ponto de Sombra (Pavor)",
  },
  contratempo: {
    id: "contratempo",
    label: "Contratempo",
    fatigue: 2,
    triggersOn: "failure",
    consequence: "Soma 1 dia à jornada e o alvo ganha 1 Fadiga adicional",
  },
  atalho: {
    id: "atalho",
    label: "Atalho",
    fatigue: 1,
    triggersOn: "success",
    consequence: "Reduz a jornada em 1 dia",
  },
  "encontro-fortuito": {
    id: "encontro-fortuito",
    label: "Encontro Fortuito",
    fatigue: 1,
    triggersOn: "success",
    consequence: "Nenhuma Fadiga é ganha e o Mestre improvisa um encontro favorável",
  },
  "visao-alegre": {
    id: "visao-alegre",
    label: "Visão Alegre",
    fatigue: 0,
    triggersOn: "success",
    consequence: "Todos na Companhia recuperam 1 Esperança",
  },
};

/**
 * Dado de Proeza → evento.
 *
 * ATENÇÃO à ordem: em lib/character/um-anel/dice.ts a Runa de Gandalf tem
 * `numeric: 10`, o mesmo valor do 10 numérico. Na tabela de eventos são
 * resultados DIFERENTES (Visão Alegre vs Encontro Fortuito), então `kind`
 * precisa ser checado ANTES de `numeric`. Testar por `numeric === 10` primeiro
 * — como resolve-attack faz de propósito para o Golpe Perfurante — daria o
 * evento errado sempre que saísse a Runa.
 */
export function torJourneyEventFromFeatDie(
  featDie: Pick<FeatDieRoll, "kind" | "numeric">
): TorJourneyEventMeta {
  if (featDie.kind === "eye") return TOR_JOURNEY_EVENT_META["terrivel-infortunio"];
  if (featDie.kind === "gandalf") return TOR_JOURNEY_EVENT_META["visao-alegre"];

  const n = featDie.numeric;
  if (n <= 1) return TOR_JOURNEY_EVENT_META.desespero;
  if (n <= 3) return TOR_JOURNEY_EVENT_META["mas-escolhas"];
  if (n <= 7) return TOR_JOURNEY_EVENT_META.contratempo;
  if (n <= 9) return TOR_JOURNEY_EVENT_META.atalho;
  return TOR_JOURNEY_EVENT_META["encontro-fortuito"];
}

/* ══════════════════════════════════════════════════════════════════════
   Resolução do evento (JOR-S02 passo 3)
   ══════════════════════════════════════════════════════════════════════ */

export type TorEventOutcome = {
  event: TorJourneyEventMeta;
  target: TorEventTarget;
  /** A rolagem do alvo passou? */
  passed: boolean;
  /** A consequência do evento disparou? */
  triggered: boolean;
  /** Fadiga para TODOS na Companhia. */
  fatigueAll: number;
  /** Fadiga extra só para o alvo (Contratempo). */
  fatigueTarget: number;
  /** Sombra para todos (Desespero). */
  shadowAll: number;
  /** Sombra só para o alvo (Más Escolhas). */
  shadowTarget: number;
  /** Esperança recuperada por todos (Visão Alegre). */
  hopeAll: number;
  /** Dias somados (+) ou reduzidos (−) na jornada. */
  dayDelta: number;
  /** O alvo fica Ferido (Terrível Infortúnio). */
  woundsTarget: boolean;
};

export function resolveTorJourneyEvent(opts: {
  event: TorJourneyEventMeta;
  target: TorEventTarget;
  passed: boolean;
}): TorEventOutcome {
  const { event, target, passed } = opts;
  const triggered = event.triggersOn === "success" ? passed : !passed;

  // Encontro Fortuito com sucesso cancela a Fadiga da Companhia.
  const cancelsFatigue = event.id === "encontro-fortuito" && triggered;

  return {
    event,
    target,
    passed,
    triggered,
    fatigueAll: cancelsFatigue ? 0 : event.fatigue,
    fatigueTarget: event.id === "contratempo" && triggered ? 1 : 0,
    shadowAll: event.id === "desespero" && triggered ? 1 : 0,
    shadowTarget: event.id === "mas-escolhas" && triggered ? 1 : 0,
    hopeAll: event.id === "visao-alegre" && triggered ? 1 : 0,
    dayDelta:
      event.id === "contratempo" && triggered
        ? 1
        : event.id === "atalho" && triggered
          ? -1
          : 0,
    woundsTarget: event.id === "terrivel-infortunio" && triggered,
  };
}

/* ══════════════════════════════════════════════════════════════════════
   Duração e marcha forçada (JOR-M03, JOR-M04)
   ══════════════════════════════════════════════════════════════════════ */

export type TorJourneyLengthInput = {
  /** Total de trechos da rota (sem contar o de partida). */
  trechos: number;
  /** Quantos deles são de terreno difícil (+1 dia cada). */
  hardTerrainTrechos: number;
  /** Companhia inteira a cavalo — metade dos dias, arredondando para cima. */
  mounted?: boolean;
  forcedMarch?: boolean;
  /** Dias somados/reduzidos por eventos ao longo do caminho. */
  eventDayDelta?: number;
};

export type TorJourneyLengthResult = {
  days: number;
  /** Fadiga extra da marcha forçada: 1 por dia de marcha forçada. */
  forcedMarchFatigue: number;
};

export function computeTorJourneyLength(input: TorJourneyLengthInput): TorJourneyLengthResult {
  const trechos = Math.max(0, Math.floor(input.trechos));
  const hard = Math.min(trechos, Math.max(0, Math.floor(input.hardTerrainTrechos)));

  // Marcha forçada: 1 dia por cada 2 trechos em vez de 1 por trecho.
  let days = input.forcedMarch ? Math.ceil(trechos / 2) : trechos;
  days += hard;

  if (input.mounted) days = Math.ceil(days / 2);

  days += input.eventDayDelta ?? 0;
  days = Math.max(0, days);

  // A Fadiga da marcha forçada é por dia de marcha forçada, então usa os dias
  // efetivamente marchados — não o total já ajustado por evento.
  const forcedMarchFatigue = input.forcedMarch ? days : 0;

  return { days, forcedMarchFatigue };
}

/* ══════════════════════════════════════════════════════════════════════
   Áreas Perigosas (JOR-M05)
   ══════════════════════════════════════════════════════════════════════ */

/**
 * A Companhia para ao entrar e enfrenta um número de eventos igual ao valor de
 * Perigo antes de poder sair.
 */
export function torPerilousAreaEventCount(perilRating: number): number {
  return Math.max(0, Math.floor(perilRating));
}

/* ══════════════════════════════════════════════════════════════════════
   Mensagens
   ══════════════════════════════════════════════════════════════════════ */

export function formatTorJourneyEventMessage(
  targetName: string,
  outcome: TorEventOutcome
): string {
  const meta = TOR_JOURNEY_ROLE_META[outcome.target.role];
  const parts = [
    `${outcome.event.label} — ${targetName} (${meta.label}) rola ${meta.skillId}: ${
      outcome.passed ? "sucesso" : "falha"
    }`,
  ];

  if (outcome.triggered) parts.push(outcome.event.consequence);
  if (outcome.fatigueAll > 0) parts.push(`Companhia +${outcome.fatigueAll} Fadiga`);
  if (outcome.fatigueTarget > 0) parts.push(`${targetName} +${outcome.fatigueTarget} Fadiga`);
  if (outcome.shadowAll > 0) parts.push(`Companhia +${outcome.shadowAll} Sombra`);
  if (outcome.shadowTarget > 0) parts.push(`${targetName} +${outcome.shadowTarget} Sombra`);
  if (outcome.hopeAll > 0) parts.push(`Companhia +${outcome.hopeAll} Esperança`);
  if (outcome.dayDelta !== 0) {
    parts.push(outcome.dayDelta > 0 ? `+${outcome.dayDelta} dia` : `${outcome.dayDelta} dia`);
  }
  if (outcome.woundsTarget) parts.push(`${targetName} está FERIDO`);

  return parts.join(" · ");
}
