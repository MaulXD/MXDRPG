/**
 * Motor de Sombra, Miséria e Fadiga do Um Anel (D27 e D25 do PRD v2.0).
 *
 * Regras: livros/um-anel/compendio/sombra.md (fonte da verdade, D15) —
 * extraídas de livros/um-anel/08-mestre-e-adversarios.md §"The Shadow".
 *
 * Substitui o estado anterior, em que lib/combat/um-anel/vitals.ts (41 linhas)
 * só sabia aplicar dano de ataque — Sombra, Miserável, Cicatrizes, Loucura e
 * Fadiga não existiam em código nenhum.
 *
 * Funções puras: recebem e devolvem números/estado, sem tocar em BattleToken nem
 * em ficha. Quem persiste é o handler da sala.
 */

import { SHADOW_PATH_BY_ID } from "@/lib/character/um-anel/data";

/* ══════════════════════════════════════════════════════════════════════
   Fontes de Sombra
   ══════════════════════════════════════════════════════════════════════ */

export const TOR_SHADOW_SOURCES = ["pavor", "ganancia", "malfeito", "feiticaria"] as const;
export type TorShadowSource = (typeof TOR_SHADOW_SOURCES)[number];

export type TorShadowSourceMeta = {
  id: TorShadowSource;
  label: string;
  /** Malfeito nunca pode ser reduzido nem cancelado por Teste de Sombra. */
  resistible: boolean;
  /** Atributo do Teste de Sombra: Pavor usa Valor, o resto usa Sabedoria. */
  testAttribute: "valour" | "wisdom" | null;
};

export const TOR_SHADOW_SOURCE_META: Record<TorShadowSource, TorShadowSourceMeta> = {
  pavor: { id: "pavor", label: "Pavor", resistible: true, testAttribute: "valour" },
  ganancia: { id: "ganancia", label: "Ganância", resistible: true, testAttribute: "wisdom" },
  malfeito: { id: "malfeito", label: "Malfeito", resistible: false, testAttribute: null },
  feiticaria: { id: "feiticaria", label: "Feitiçaria", resistible: true, testAttribute: "wisdom" },
};

/** Tabela de Fontes de Pavor (SOM-P01…P04). */
export const TOR_DREAD_TABLE = [
  { points: 1, label: "Tragédia natural inesperada" },
  { points: 2, label: "Matança horrenda, obra de Orc" },
  { points: 3, label: "Experiência atroz, tormento físico e espiritual" },
  { points: 4, label: "Sentir diretamente o poder do Inimigo" },
] as const;

/** Tabela de Malfeitos (SOM-M01…M05). O último traz Cicatriz junto. */
export const TOR_MISDEED_TABLE = [
  { points: 1, scars: 0, label: "Ameaças violentas e mentiras maliciosas; crueldade irrefletida" },
  { points: 2, scars: 0, label: "Manipular outros; abusar da autoridade; crueldade deliberada" },
  { points: 3, scars: 0, label: "Roubo ou pilhagem; quebra de juramento ou covardia; traição" },
  { points: 4, scars: 0, label: "Tormento ou tortura; matar inimigo rendido ou gente inofensiva" },
  { points: 4, scars: 1, label: "Assassinato; agir voluntariamente a serviço do Inimigo" },
] as const;

/* ══════════════════════════════════════════════════════════════════════
   Estado espiritual
   ══════════════════════════════════════════════════════════════════════ */

export type TorSpiritState = {
  shadow: number;
  shadowScars: number;
  hopeValue: number;
  hopeMax: number;
  fatigue: number;
  enduranceValue: number;
  /**
   * Carga do equipamento (sem a Fadiga). Necessária porque Exausto compara
   * Resistência com a Carga **total**, e a Fadiga entra somando à Carga —
   * não substituindo (04-caracteristicas.md §"Fatigue").
   */
  load: number;
  /** Falhas já adquiridas no Caminho da Sombra (0–4). */
  flaws: number;
};

export type TorSpiritFlags = {
  /** Sombra ≥ Esperança atual — Olho de Sauron passa a ser falha automática. */
  miserable: boolean;
  /**
   * Resistência atual ≤ Carga TOTAL (equipamento + Fadiga) — Dados de Sucesso
   * com 1–3 são zerados.
   *
   * A doc dizia "Fadiga ≥ Resistência atual", que é o bug já corrigido escrito ao
   * contrário: omitia a Carga do equipamento. O código em deriveTorSpiritFlags
   * sempre esteve certo (usa totalTorLoad), mas um comentário errado a 30 linhas
   * de distância convida alguem a "consertar" o código pra bater com ele.
   */
  weary: boolean;
  /** Sombra alcançou a Esperança máxima — Desfavorecido em tudo. */
  illFavouredByShadow: boolean;
  /** 4 Falhas + Sombra no máximo — sai de jogo em vez de ficar Desfavorecido. */
  succumbed: boolean;
};

export const TOR_MAX_FLAWS = 4;

/**
 * Carga total = Carga do equipamento + Fadiga.
 *
 * A Fadiga **soma** à Carga, não substitui: "When gained, Fatigue points
 * temporarily raise a travelling Player-hero's total Load, effectively making it
 * easier to become Weary" (04-caracteristicas.md).
 */
export function totalTorLoad(state: Pick<TorSpiritState, "load" | "fatigue">): number {
  return Math.max(0, state.load) + Math.max(0, state.fatigue);
}

/**
 * Deriva as condições a partir dos números. Nunca guardar `miserable`/`weary`
 * como fonte da verdade: eles são consequência de Sombra/Fadiga/Carga, e guardar
 * ambos abre espaço para ficarem dessincronizados.
 */
export function deriveTorSpiritFlags(state: TorSpiritState): TorSpiritFlags {
  // Cicatrizes contam como Sombra normal para todos os efeitos (SOM-R06).
  const totalShadow = state.shadow + state.shadowScars;
  const atMaxShadow = totalShadow >= state.hopeMax;
  return {
    miserable: totalShadow >= state.hopeValue,
    // Exausto compara Resistência com a Carga TOTAL, não com a Fadiga isolada.
    weary: state.enduranceValue <= totalTorLoad(state),
    // Quem já sucumbiu sai de jogo — não faz sentido também marcar Desfavorecido.
    illFavouredByShadow: atMaxShadow && state.flaws < TOR_MAX_FLAWS,
    succumbed: atMaxShadow && state.flaws >= TOR_MAX_FLAWS,
  };
}

/* ══════════════════════════════════════════════════════════════════════
   Ganho de Sombra
   ══════════════════════════════════════════════════════════════════════ */

export type TorShadowGainInput = {
  source: TorShadowSource;
  points: number;
  /** Cicatrizes que vêm junto (só o Malfeito mais grave, SOM-M05). */
  scars?: number;
  /**
   * Resultado de um Teste de Sombra já rolado, quando houve.
   * `reduction` = 1 no sucesso + 1 por ícone de Sucesso (SOM-R04).
   */
  shadowTest?: { passed: boolean; successIcons: number };
};

export type TorShadowGainResult = {
  /** Pontos que efetivamente entraram, depois do teste e do teto. */
  applied: number;
  /** Pontos anulados pelo Teste de Sombra. */
  resisted: number;
  /** Pontos perdidos por bater no teto (SOM-R01). */
  overflow: number;
  scarsAdded: number;
  state: TorSpiritState;
  flags: TorSpiritFlags;
};

export function applyTorShadowGain(
  state: TorSpiritState,
  input: TorShadowGainInput
): TorShadowGainResult {
  const meta = TOR_SHADOW_SOURCE_META[input.source];
  const requested = Math.max(0, Math.floor(input.points));

  // Teste de Sombra só vale para fontes resistíveis. Malfeito ignora o teste
  // mesmo se o chamador mandar um — é a regra explícita do livro.
  let resisted = 0;
  if (meta.resistible && input.shadowTest?.passed) {
    resisted = Math.min(requested, 1 + Math.max(0, input.shadowTest.successIcons));
  }

  const afterTest = requested - resisted;

  // Teto: Sombra + Cicatrizes nunca passa da Esperança máxima.
  const scarsAdded = Math.max(0, Math.floor(input.scars ?? 0));
  const nextScars = state.shadowScars + scarsAdded;
  const room = Math.max(0, state.hopeMax - (state.shadow + nextScars));
  const applied = Math.min(afterTest, room);
  const overflow = afterTest - applied;

  const next: TorSpiritState = {
    ...state,
    shadow: state.shadow + applied,
    shadowScars: nextScars,
  };

  return {
    applied,
    resisted,
    overflow,
    scarsAdded,
    state: next,
    flags: deriveTorSpiritFlags(next),
  };
}

/* ══════════════════════════════════════════════════════════════════════
   Endurecer a Vontade e Acesso de Loucura
   ══════════════════════════════════════════════════════════════════════ */

export type TorHardenWillResult =
  | { ok: false; reason: string }
  | { ok: true; removed: number; state: TorSpiritState; flags: TorSpiritFlags };

/**
 * SOM-R05 — troca toda a Sombra atual por 1 Cicatriz. Só antes de bater no
 * máximo: quem já está lá precisa do Acesso de Loucura.
 */
export function hardenTorWill(state: TorSpiritState): TorHardenWillResult {
  const total = state.shadow + state.shadowScars;
  if (total >= state.hopeMax) {
    return {
      ok: false,
      reason: "Sombra já alcançou a Esperança máxima — só um Acesso de Loucura resolve",
    };
  }
  if (state.shadow <= 0) {
    return { ok: false, reason: "Nenhum ponto de Sombra para endurecer" };
  }

  const next: TorSpiritState = {
    ...state,
    shadow: 0,
    shadowScars: state.shadowScars + 1,
  };
  return { ok: true, removed: state.shadow, state: next, flags: deriveTorSpiritFlags(next) };
}

export type TorMadnessResult =
  | { ok: false; reason: string }
  | {
      ok: true;
      /** Falha ganha (índice 1–4 no Caminho da Sombra). */
      flawIndex: number;
      flawName: string | null;
      shadowPathLabel: string | null;
      /** 4ª Falha — o próximo pico de Sombra retira o herói de jogo. */
      atFinalFlaw: boolean;
      state: TorSpiritState;
      flags: TorSpiritFlags;
    };

/**
 * SOM-L01 — Acesso de Loucura: zera a Sombra (Cicatrizes permanecem) e avança
 * um passo no Caminho da Sombra da Vocação.
 */
export function applyTorBoutOfMadness(
  state: TorSpiritState,
  shadowPathId: string,
  pathFlaws: Record<string, string[]> = {}
): TorMadnessResult {
  if (state.shadow + state.shadowScars < state.hopeMax) {
    return {
      ok: false,
      reason: "Acesso de Loucura só ocorre quando a Sombra alcança a Esperança máxima",
    };
  }
  if (state.flaws >= TOR_MAX_FLAWS) {
    return { ok: false, reason: "Herói já tem as 4 Falhas — sucumbiu à Sombra" };
  }

  const flawIndex = state.flaws + 1;
  const next: TorSpiritState = { ...state, shadow: 0, flaws: flawIndex };

  return {
    ok: true,
    flawIndex,
    flawName: pathFlaws[shadowPathId]?.[flawIndex - 1] ?? null,
    shadowPathLabel: SHADOW_PATH_BY_ID[shadowPathId]?.label ?? null,
    atFinalFlaw: flawIndex >= TOR_MAX_FLAWS,
    state: next,
    flags: deriveTorSpiritFlags(next),
  };
}

/* ══════════════════════════════════════════════════════════════════════
   Recuperação
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Descanso Prolongado em refúgio seguro: 1 ponto de Fadiga por descanso
 * (JOR-M02). Cicatrizes NÃO saem aqui — só na Empreitada Curar Cicatrizes
 * numa Fase de Yule (SOM-R06).
 */
export function applyTorProlongedRest(state: TorSpiritState): {
  state: TorSpiritState;
  flags: TorSpiritFlags;
  fatigueRemoved: number;
} {
  const fatigueRemoved = state.fatigue > 0 ? 1 : 0;
  const next: TorSpiritState = { ...state, fatigue: Math.max(0, state.fatigue - fatigueRemoved) };
  return { state: next, flags: deriveTorSpiritFlags(next), fatigueRemoved };
}

/**
 * Fim de jornada (JOR-M02): reduz Fadiga pelo Vigor da montaria, depois pela
 * rolagem de Viagem (1 no sucesso + 1 por ícone).
 */
export function applyTorJourneyEndRecovery(
  state: TorSpiritState,
  opts: { mountVigour?: number; travelRoll?: { passed: boolean; successIcons: number } }
): { state: TorSpiritState; flags: TorSpiritFlags; removed: number } {
  let removed = Math.max(0, Math.floor(opts.mountVigour ?? 0));
  if (opts.travelRoll?.passed) {
    removed += 1 + Math.max(0, opts.travelRoll.successIcons);
  }
  removed = Math.min(removed, state.fatigue);

  const next: TorSpiritState = { ...state, fatigue: state.fatigue - removed };
  return { state: next, flags: deriveTorSpiritFlags(next), removed };
}

/** Custo da Empreitada Curar Cicatrizes, em pontos de Aventura. */
export const TOR_HEAL_SCAR_COST = 5;

/**
 * Empreitada Curar Cicatrizes — só em Fase de Yule (SOM-R06), e **custa 5
 * pontos de Aventura**: "gaste **5 pontos de Aventura** e remova **1 Cicatriz
 * de Sombra**" (`07-fases-de-companhia-jornada.md`).
 *
 * O custo estava ausente até a rodada 6 do loop. A função ainda não tem chamador
 * em produção, então nenhuma Cicatriz saiu de graça em mesa — mas quem fosse
 * ligá-la entregaria a Empreitada sem cobrar. Corrigido antes de existir
 * chamador, que é a hora barata de corrigir.
 */
export function healTorShadowScar(
  state: TorSpiritState,
  opts: { isYule: boolean; availableAdventurePoints: number }
):
  | { ok: false; reason: string }
  | {
      ok: true;
      state: TorSpiritState;
      flags: TorSpiritFlags;
      spentAdventurePoints: number;
    } {
  if (!opts.isYule) {
    return { ok: false, reason: "Curar Cicatrizes só na Fase de Companhia de Yule" };
  }
  if (state.shadowScars <= 0) {
    return { ok: false, reason: "Nenhuma Cicatriz de Sombra para curar" };
  }
  if (opts.availableAdventurePoints < TOR_HEAL_SCAR_COST) {
    return {
      ok: false,
      reason: `Curar Cicatrizes custa ${TOR_HEAL_SCAR_COST} pontos de Aventura (tem ${opts.availableAdventurePoints})`,
    };
  }
  const next: TorSpiritState = { ...state, shadowScars: state.shadowScars - 1 };
  return {
    ok: true,
    state: next,
    flags: deriveTorSpiritFlags(next),
    spentAdventurePoints: TOR_HEAL_SCAR_COST,
  };
}

/* ══════════════════════════════════════════════════════════════════════
   Mensagens
   ══════════════════════════════════════════════════════════════════════ */

export function formatTorShadowGainMessage(
  heroName: string,
  input: TorShadowGainInput,
  result: TorShadowGainResult
): string {
  const meta = TOR_SHADOW_SOURCE_META[input.source];
  const parts = [`${heroName} — ${meta.label}: +${result.applied} Sombra`];

  if (result.resisted > 0) parts.push(`Teste de Sombra anulou ${result.resisted}`);
  if (result.overflow > 0) parts.push(`${result.overflow} perdido no teto`);
  if (result.scarsAdded > 0) parts.push(`+${result.scarsAdded} Cicatriz de Sombra`);

  parts.push(`Sombra ${result.state.shadow}+${result.state.shadowScars}/${result.state.hopeMax}`);

  if (result.flags.succumbed) parts.push("SUCUMBIU À SOMBRA — fora de jogo");
  else if (result.flags.illFavouredByShadow) parts.push("Desfavorecido — precisa de Acesso de Loucura");
  else if (result.flags.miserable) parts.push("MISERÁVEL");

  return parts.join(" · ");
}
