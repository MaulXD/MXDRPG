/**
 * Estado de sessão do Um Anel guardado em `RoomState.torSession` — Jornada,
 * Conselho e Fase de Companhia.
 *
 * Por que existe: os três painéis nasceram com estado só no `useState` do
 * Mestre. Funcionava (tudo era narrado no chat), mas recarregar a página no
 * meio de uma jornada perdia o progresso, e os jogadores só viam o texto do
 * chat — nunca o placar. Aqui o estado passa a ser da SALA, então sobrevive a
 * recarga e chega a todos por SSE.
 *
 * `eldarin_rooms` guarda a mesa como JSONB, então adicionar este campo não
 * exige migração. Tudo é opcional e normalizado na leitura: mesa antiga sem o
 * campo continua carregando.
 *
 * Isolamento de hub: só entra em mesa `rpgSystemId === "um-anel"`. O Eldarin
 * nunca lê nem escreve aqui.
 */

import type { TorCouncilState } from "@/lib/combat/um-anel/council";
import { isTorCouncilResistance } from "@/lib/combat/um-anel/council";
import {
  TOR_REGION_TYPES,
  TOR_SEASONS,
  type TorJourneyEventId,
  type TorJourneyRole,
  type TorRegionType,
  type TorSeason,
} from "@/lib/combat/um-anel/journey";
import { TOR_PHASE_OUTCOMES, type TorPhaseOutcome } from "@/lib/combat/um-anel/progression";

/** Evento aguardando a rolagem do herói alvo. */
export type TorPendingEvent = {
  eventId: TorJourneyEventId;
  role: TorJourneyRole;
  skillId: string;
  terrain: "estrada" | "normal" | "dificil";
};

export type TorJourneyProgress = {
  /** Total de trechos da rota (sem contar o de partida). */
  trechos: number;
  hardTerrainTrechos: number;
  season: TorSeason;
  region: TorRegionType;
  mounted: boolean;
  forcedMarch: boolean;
  /** Trechos que faltam. `0` = chegou. */
  remaining: number;
  /** Dias somados/reduzidos por eventos. */
  dayDelta: number;
  pending: TorPendingEvent | null;
  /** Diário da viagem — linhas curtas, na ordem em que aconteceram. */
  log: string[];
};

export type TorFellowshipProgress = {
  year: number;
  phasesThisYear: number;
  companySize: number;
  witsScore: number;
  outcome: TorPhaseOutcome;
  /** Empreitadas escolhidas nesta Fase. */
  picks: string[];
};

export type TorSessionState = {
  journey?: TorJourneyProgress | null;
  council?: TorCouncilState | null;
  fellowship?: TorFellowshipProgress | null;
};

/* ══════════════════════════════════════════════════════════════════════
   Normalização
   ══════════════════════════════════════════════════════════════════════
   Estado de sala vem de JSONB e pode ter sido escrito por uma versão
   anterior do código. Nada aqui confia na forma do que leu. */

const TERRAINS = ["estrada", "normal", "dificil"] as const;

function int(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.floor(v) : fallback;
  return Math.min(max, Math.max(min, n));
}

function bool(v: unknown): boolean {
  return v === true;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function strList(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string").slice(0, max);
}

function normalizePending(raw: unknown): TorPendingEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.eventId !== "string" || typeof r.role !== "string") return null;
  return {
    eventId: r.eventId as TorJourneyEventId,
    role: r.role as TorJourneyRole,
    skillId: typeof r.skillId === "string" ? r.skillId : "explorar",
    terrain: oneOf(r.terrain, TERRAINS, "normal"),
  };
}

function normalizeJourney(raw: unknown): TorJourneyProgress | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const trechos = int(r.trechos, 10, 1, 40);
  return {
    trechos,
    // Terreno difícil nunca passa do total de trechos.
    hardTerrainTrechos: int(r.hardTerrainTrechos, 0, 0, trechos),
    season: oneOf(r.season, TOR_SEASONS, "verao"),
    region: oneOf(r.region, TOR_REGION_TYPES, "selvagem"),
    mounted: bool(r.mounted),
    forcedMarch: bool(r.forcedMarch),
    remaining: int(r.remaining, trechos, 0, trechos),
    dayDelta: int(r.dayDelta, 0, -60, 60),
    pending: normalizePending(r.pending),
    log: strList(r.log, 60),
  };
}

function normalizeCouncil(raw: unknown): TorCouncilState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const resistance = typeof r.resistance === "number" ? r.resistance : 6;
  if (!isTorCouncilResistance(resistance)) return null;
  return {
    resistance,
    timeLimit: int(r.timeLimit, resistance, 0, 40),
    disasterOnFailure: bool(r.disasterOnFailure),
    successes: int(r.successes, 0, 0, 99),
    attemptsUsed: int(r.attemptsUsed, 0, 0, 99),
  };
}

function normalizeFellowship(raw: unknown): TorFellowshipProgress | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    year: int(r.year, 2965, 1, 9999),
    // 0–2: a terceira Fase é o Yule, que zera e vira o ano.
    phasesThisYear: int(r.phasesThisYear, 0, 0, 2),
    companySize: int(r.companySize, 4, 1, 8),
    // Teto 7, não 6: os arrays de Atributo de data.ts oferecem ASTÚCIA 7 pra
    // Elfos de Lindon, Hobbits do Condado e Altos-Elfos de Valfenda. Com teto 6
    // o bônus de Perícia do Yule desses heróis era silenciosamente cortado em 1
    // ponto por ano. verify-um-anel-session-state.mjs amarra este teto ao maior
    // `argucia` de data.ts — se um suplemento trouxer 8, o teste acusa aqui.
    witsScore: int(r.witsScore, 3, 0, 7),
    outcome: oneOf(r.outcome, TOR_PHASE_OUTCOMES, "marginal"),
    picks: strList(r.picks, 12),
  };
}

/** Devolve `undefined` quando não há nada guardado, para não inflar o JSON da sala. */
export function normalizeTorSession(raw: unknown): TorSessionState | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;

  const journey = normalizeJourney(r.journey);
  const council = normalizeCouncil(r.council);
  const fellowship = normalizeFellowship(r.fellowship);

  if (!journey && !council && !fellowship) return undefined;
  return {
    ...(journey ? { journey } : {}),
    ...(council ? { council } : {}),
    ...(fellowship ? { fellowship } : {}),
  };
}

/**
 * Patch parcial: `null` num campo apaga aquele trecho (encerrar a jornada),
 * `undefined` deixa como está. Sem essa distinção não haveria como diferenciar
 * "não mexi" de "quero limpar".
 */
export type TorSessionPatch = {
  journey?: TorJourneyProgress | null;
  council?: TorCouncilState | null;
  fellowship?: TorFellowshipProgress | null;
};

export function applyTorSessionPatch(
  current: TorSessionState | undefined,
  patch: TorSessionPatch
): TorSessionState | undefined {
  const next: TorSessionState = { ...(current ?? {}) };

  if ("journey" in patch) {
    if (patch.journey === null) delete next.journey;
    else next.journey = normalizeJourney(patch.journey) ?? undefined;
  }
  if ("council" in patch) {
    if (patch.council === null) delete next.council;
    else next.council = normalizeCouncil(patch.council) ?? undefined;
  }
  if ("fellowship" in patch) {
    if (patch.fellowship === null) delete next.fellowship;
    else next.fellowship = normalizeFellowship(patch.fellowship) ?? undefined;
  }

  if (!next.journey && !next.council && !next.fellowship) return undefined;
  return next;
}
