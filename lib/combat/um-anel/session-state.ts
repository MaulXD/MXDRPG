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
  TOR_JOURNEY_ROLES,
  TOR_SEASONS,
  type TorRoleAssignment,
  type TorJourneyEventId,
  type TorJourneyRole,
  type TorRegionType,
  type TorSeason,
} from "@/lib/combat/um-anel/journey";
import {
  TOR_PHASE_OUTCOMES,
  type TorPhaseOutcome,
  type TorPhasePurchases,
} from "@/lib/combat/um-anel/progression";

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
  /**
   * Quem cobre cada papel da Jornada (Guia, Batedor, Olheiro, Caçador).
   *
   * O motor sempre soube que o evento cai sobre um PAPEL, e o painel já dizia
   * "o Caçador rola Caçada" — mas ninguém era atribuído a papel nenhum, então a
   * mesa tinha de lembrar de cabeça quem era o Caçador. Guardar aqui é o que
   * torna `validateTorRoleAssignment` utilizável: um Guia só, e nenhum papel
   * descoberto.
   *
   * Nomes, não ids de ficha: o Mestre pode pôr um PNJ como Guia, e o apelido é
   * o que a mesa lê.
   */
  roles?: TorRoleAssignment;
  /** Diário da viagem — linhas curtas, na ordem em que aconteceram. */
  log: string[];
};

export type TorFellowshipHero = {
  /** Nome exibido no anúncio do Yule — apelido, nunca nome real de conta. */
  name: string;
  /** ASTÚCIA do herói: define o bônus de Perícia DELE no Yule. */
  wits: number;
};

/** Tamanho máximo da Companhia. */
export const TOR_MAX_COMPANY = 8;

export type TorFellowshipProgress = {
  year: number;
  phasesThisYear: number;
  /**
   * Os heróis da Companhia.
   *
   * O bônus de Perícia do Yule é POR HERÓI: "todos os heróis-jogadores ganham um
   * número de pontos de Perícia bônus igual ao **seu** nível de ASTÚCIA"
   * (`07-fases-de-companhia-jornada.md`). Antes havia um `witsScore` único pra
   * Companhia inteira, o que dava o mesmo bônus a todos e errava a maioria numa
   * Companhia mista — um Elfo (Astúcia 7) recebia o mesmo que um Bardo (3).
   *
   * Também é a fonte do tamanho da Companhia: o orçamento de Empreitadas no Yule
   * é 1 por herói, e derivar de `heroes.length` evita duas fontes de verdade que
   * podem discordar.
   */
  heroes: TorFellowshipHero[];
  outcome: TorPhaseOutcome;
  /** Empreitadas escolhidas nesta Fase. */
  picks: string[];
  /**
   * O que cada herói já comprou NESTA Fase, por id de ficha.
   *
   * Mora aqui, e não na ficha, porque o limite do livro é por **Fase de
   * Companhia** — "durante uma única Fase de Companhia, os jogadores podem
   * comprar no máximo um grau em cada Perícia". Guardar na ficha exigiria saber
   * quando zerar; aqui zera sozinho, porque fechar a Fase constrói um estado
   * novo a partir do calendário avançado.
   */
  purchases?: Record<string, TorPhasePurchases>;
};

export type TorSessionState = {
  journey?: TorJourneyProgress | null;
  council?: TorCouncilState | null;
  fellowship?: TorFellowshipProgress | null;
  /**
   * Base do Número-Alvo dos Atributos. Padrão 20; **18** é a regra opcional do
   * quadro "Ajustando os Números-Alvo" (02-resolucao-de-acoes.md), para campanhas
   * curtas ou jogo de uma sessão.
   *
   * É opção de mesa, e não da ficha: o mesmo herói pode ser levado a uma
   * campanha longa e a uma one-shot. É também o que explica o NA impresso nas
   * fichas pré-geradas do Starter Set (ver 11-personagens-exemplo.md).
   */
  attributeTnBase?: 18 | 20;
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
    ...(normalizeRoles(r.roles) ? { roles: normalizeRoles(r.roles)! } : {}),
    log: strList(r.log, 60),
  };
}

/** Papéis da Jornada, recortados — só os quatro do livro, nomes curtos. */
function normalizeRoles(raw: unknown): TorRoleAssignment | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const out: TorRoleAssignment = {};
  for (const role of TOR_JOURNEY_ROLES) {
    const nomes = strList(r[role], TOR_MAX_COMPANY).map((n) => n.slice(0, 60));
    if (nomes.length > 0) out[role] = nomes;
  }
  return Object.keys(out).length > 0 ? out : null;
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

/**
 * Recorta a lista de heróis vinda do JSONB.
 *
 * Teto de ASTÚCIA 7, não 6: os arrays de Atributo de `data.ts` oferecem ASTÚCIA 7
 * pra Elfos de Lindon, Hobbits do Condado e Altos-Elfos de Valfenda. Com teto 6 o
 * bônus de Perícia do Yule desses heróis era cortado em 1 ponto por ano.
 * `verify-um-anel-session-state.mjs` amarra este teto ao maior `argucia` de
 * `data.ts` — se um suplemento trouxer 8, o teste acusa aqui.
 */
function normalizeHeroes(r: Record<string, unknown>): TorFellowshipHero[] {
  if (Array.isArray(r.heroes)) {
    const list = r.heroes
      .filter((h): h is Record<string, unknown> => Boolean(h) && typeof h === "object")
      .slice(0, TOR_MAX_COMPANY)
      .map((h, i) => ({
        name:
          typeof h.name === "string" && h.name.trim().length > 0
            ? h.name.trim().slice(0, 40)
            : `Herói ${i + 1}`,
        wits: int(h.wits, 3, 0, 7),
      }));
    if (list.length > 0) return list;
  }
  // Migração de sala gravada por versão anterior, que tinha um `witsScore` único
  // e um `companySize`. Reconstrói a lista preservando os números que estavam lá,
  // pra ninguém perder o calendário da campanha numa atualização.
  const size = int(r.companySize, 4, 1, TOR_MAX_COMPANY);
  const wits = int(r.witsScore, 3, 0, 7);
  return Array.from({ length: size }, (_, i) => ({ name: `Herói ${i + 1}`, wits }));
}

function normalizeFellowship(raw: unknown): TorFellowshipProgress | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    year: int(r.year, 2965, 1, 9999),
    // 0–2: a terceira Fase é o Yule, que zera e vira o ano.
    phasesThisYear: int(r.phasesThisYear, 0, 0, 2),
    heroes: normalizeHeroes(r),
    outcome: oneOf(r.outcome, TOR_PHASE_OUTCOMES, "marginal"),
    picks: strList(r.picks, 12),
    ...(normalizePurchases(r.purchases) ? { purchases: normalizePurchases(r.purchases)! } : {}),
  };
}

/** Compras da Fase, recortadas: o estado da sala vem de JSONB e não é confiável. */
function normalizePurchases(raw: unknown): Record<string, TorPhasePurchases> | null {
  if (!raw || typeof raw !== "object") return null;
  const out: Record<string, TorPhasePurchases> = {};
  for (const [id, v] of Object.entries(raw as Record<string, unknown>).slice(0, TOR_MAX_COMPANY)) {
    if (!v || typeof v !== "object") continue;
    const p = v as Record<string, unknown>;
    const ranks = (x: unknown) => {
      const o: Record<string, number> = {};
      if (x && typeof x === "object") {
        for (const [k, n] of Object.entries(x as Record<string, unknown>).slice(0, 24)) {
          // 1 grau por Perícia/Proficiência é o teto do livro; guardar mais
          // deixaria o limite passar na próxima leitura.
          if (typeof n === "number" && n > 0) o[k.slice(0, 40)] = Math.min(1, Math.floor(n));
        }
      }
      return o;
    };
    out[id.slice(0, 80)] = {
      skillRanks: ranks(p.skillRanks),
      proficiencyRanks: ranks(p.proficiencyRanks),
      boughtValour: p.boughtValour === true,
      boughtWisdom: p.boughtWisdom === true,
    };
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** Devolve `undefined` quando não há nada guardado, para não inflar o JSON da sala. */
export function normalizeTorSession(raw: unknown): TorSessionState | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;

  const journey = normalizeJourney(r.journey);
  const council = normalizeCouncil(r.council);
  const fellowship = normalizeFellowship(r.fellowship);

  // 18 só entra se estiver escrito exatamente assim — qualquer outro valor cai
  // no padrão do livro, que é 20.
  const attributeTnBase = r.attributeTnBase === 18 ? (18 as const) : undefined;

  if (!journey && !council && !fellowship && !attributeTnBase) return undefined;
  return {
    ...(journey ? { journey } : {}),
    ...(council ? { council } : {}),
    ...(fellowship ? { fellowship } : {}),
    ...(attributeTnBase ? { attributeTnBase } : {}),
  };
}

/** Base do NA em uso na mesa — 20 quando a opção não foi ligada. */
export function torAttributeTnBase(session: TorSessionState | undefined): number {
  return session?.attributeTnBase === 18 ? 18 : 20;
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
  /** `null` volta ao padrão do livro (20). */
  attributeTnBase?: 18 | 20 | null;
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
  if ("attributeTnBase" in patch) {
    // Só 18 é gravado; 20 é o padrão e some do estado, para uma mesa que nunca
    // mexeu na opção ficar indistinguível de uma que a desligou.
    if (patch.attributeTnBase === 18) next.attributeTnBase = 18;
    else delete next.attributeTnBase;
  }

  if (!next.journey && !next.council && !next.fellowship) return undefined;
  return next;
}
