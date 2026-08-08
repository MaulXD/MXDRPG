/**
 * Fadiga que SOBE — o lado que faltava (06-fases-de-aventura-combate.md §"Fadiga
 * de Viagem", §"Marcha Forçada" e a Tabela de Eventos de Jornada).
 *
 * O motor já tinha três formas de TIRAR Fadiga (Descanso Prolongado, Vigor da
 * montaria, rolagem de VIAGEM no fim da jornada) e **nenhuma de pôr**. O único
 * jeito de a Fadiga subir era alguém digitar o número no contador da ficha — e
 * como Exausto é derivado de `Resistência ≤ Carga + Fadiga`, a condição que a
 * Fadiga existe para produzir nunca disparava sozinha.
 *
 * Duas Virtudes Culturais mexem no ganho, e é por isso que ele é por herói e não
 * um número só para a Companhia:
 *
 * - **Cram** (Bardos): "Cada vez que você ganha Fadiga por um Evento de Jornada,
 *   você ganha 1 ponto menos" — só Evento de Jornada, não marcha forçada.
 * - **Resistência do Ranger** (Rangers do Norte): "Se você usar uma armadura de
 *   Couro ou nenhuma armadura, e não carregar escudo, você nunca ganha Fadiga
 *   durante uma jornada."
 *
 * Quem SOMA a Fadiga ao estado espiritual é `applyTorFatigueGain`, em shadow.ts,
 * ao lado das funções que a tiram — as duas direções da mesma regra moram juntas
 * de propósito.
 *
 * Funções puras, sem import de runtime: a tabela de armaduras entra já traduzida
 * em `TorArmourWeight` pelo chamador.
 */

/* ══════════════════════════════════════════════════════════════════════
   Fontes
   ══════════════════════════════════════════════════════════════════════ */

/**
 * De onde a Fadiga veio. Importa porque **Cram só vale para Evento de Jornada**
 * — usar uma fonte só apagaria essa distinção do livro.
 */
export const TOR_FATIGUE_SOURCES = ["evento", "marcha-forcada", "mestre"] as const;
export type TorFatigueSource = (typeof TOR_FATIGUE_SOURCES)[number];

export const TOR_FATIGUE_SOURCE_META: Record<
  TorFatigueSource,
  { id: TorFatigueSource; label: string; description: string }
> = {
  evento: {
    id: "evento",
    label: "Evento de Jornada",
    description:
      "A coluna de Fadiga da Tabela de Eventos: todos na Companhia ganham os pontos indicados.",
  },
  "marcha-forcada": {
    id: "marcha-forcada",
    label: "Marcha forçada",
    description: "1 ponto adicional por cada dia de marcha forçada.",
  },
  mestre: {
    id: "mestre",
    label: "Decisão do Mestre",
    description:
      "Fadiga narrada na cena — dormir de barriga vazia, um dia especialmente duro, o alvo de um Contratempo.",
  },
};

export function isTorFatigueSource(v: unknown): v is TorFatigueSource {
  return typeof v === "string" && (TOR_FATIGUE_SOURCES as readonly string[]).includes(v);
}

/* ══════════════════════════════════════════════════════════════════════
   Quanto cada herói ganha de verdade
   ══════════════════════════════════════════════════════════════════════ */

/** Ids das Virtudes Culturais que mexem no ganho — ver cultural-virtues.ts. */
export const TOR_VIRTUE_CRAM = "cram";
export const TOR_VIRTUE_RANGER_ENDURANCE = "resistencia-do-ranger";

/** O que a Resistência do Ranger enxerga da armadura: nada, Couro, ou o resto. */
export type TorArmourWeight = "nenhuma" | "couro" | "pesada";

/**
 * Traduz a entrada da tabela de armaduras (data.ts) no peso que a Virtude usa.
 *
 * Vestir algo que a tabela não conhece conta como **pesada**: errar para o lado
 * de conceder a isenção daria de graça o que a Virtude cobra um grau de SABEDORIA
 * para ter.
 */
export function torArmourWeight(armour: {
  equipped: boolean;
  type?: string | null;
}): TorArmourWeight {
  if (!armour.equipped) return "nenhuma";
  return armour.type === "leather" ? "couro" : "pesada";
}

/** O que do herói entra na conta: Virtudes e o que ele está vestindo. */
export type TorFatigueBearer = {
  virtues: readonly string[];
  armour: TorArmourWeight;
  hasShield: boolean;
};

export type TorFatigueGainResult = {
  /** Pontos que o evento/marcha mandou. */
  requested: number;
  /** Pontos que o herói realmente ganha. */
  gained: number;
  /** Pontos evitados por Virtude. */
  spared: number;
  /** Virtudes que agiram, em rótulo de mesa. */
  reasons: string[];
};

/**
 * Resistência do Ranger exige armadura de **Couro ou nenhuma** e **sem escudo**.
 *
 * O Elmo não entra: o livro nomeia armadura e escudo, e nada mais. Ler "sem
 * escudo" como "sem nada de metal" seria inventar uma restrição que a Virtude não
 * tem.
 */
export function torRangerEnduranceApplies(bearer: TorFatigueBearer): boolean {
  if (!bearer.virtues.includes(TOR_VIRTUE_RANGER_ENDURANCE)) return false;
  if (bearer.hasShield) return false;
  return bearer.armour === "nenhuma" || bearer.armour === "couro";
}

export function torFatigueGain(
  bearer: TorFatigueBearer,
  input: { points: number; source: TorFatigueSource }
): TorFatigueGainResult {
  const requested = Math.max(0, Math.floor(input.points));
  const reasons: string[] = [];

  // Cancelamento total vem antes da redução de 1: as duas Virtudes são de
  // Culturas diferentes e nunca coexistem numa ficha, mas se coexistissem
  // "nunca ganha Fadiga" é o mais forte dos dois.
  if (torRangerEnduranceApplies(bearer)) {
    return { requested, gained: 0, spared: requested, reasons: ["Resistência do Ranger"] };
  }

  let gained = requested;
  if (input.source === "evento" && bearer.virtues.includes(TOR_VIRTUE_CRAM)) {
    gained = Math.max(0, gained - 1);
    reasons.push("Cram");
  }

  return { requested, gained, spared: requested - gained, reasons };
}

/* ══════════════════════════════════════════════════════════════════════
   Mensagens
   ══════════════════════════════════════════════════════════════════════ */

export function formatTorFatigueLine(
  heroName: string,
  result: TorFatigueGainResult,
  after: { fatigue: number; becameWeary: boolean }
): string {
  if (result.gained === 0) {
    const porque = result.reasons.length > 0 ? ` (${result.reasons.join(", ")})` : "";
    return `${heroName} não ganha Fadiga${porque}`;
  }
  const reduzido =
    result.spared > 0 && result.reasons.length > 0
      ? ` (−${result.spared} por ${result.reasons.join(", ")})`
      : "";
  return (
    `${heroName} +${result.gained} de Fadiga${reduzido} (agora ${after.fatigue})` +
    (after.becameWeary ? " · ficou EXAUSTO" : "")
  );
}
