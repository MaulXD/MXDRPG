/**
 * Atenção do Olho e a Caçada (08-mestre-e-adversarios.md §"O Olho de Mordor").
 *
 * Sistema inteiro que não existia no app: quanta atenção o Inimigo dedica à
 * Companhia, e o momento em que ela é **Revelada**.
 *
 * **É regra opcional, e o livro diz isso em voz alta:** "as regras relativas ao
 * Olho de Mordor são particularmente adequadas para serem introduzidas mais
 * tarde no jogo (…) acrescentam uma camada de complexidade que não todo grupo
 * achará do seu gosto". Por isso o estado tem um interruptor e nasce desligado —
 * uma mesa que nunca ligou não vê nada disso.
 *
 * Funções puras, sem import de runtime.
 */

import type { TorCultureId } from "@/lib/character/um-anel/types";
import type { TorRegionType } from "./journey";

/* ══════════════════════════════════════════════════════════════════════
   Atenção do Olho inicial
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Valor básico por Cultura presente na Companhia.
 *
 * "Aplique apenas a entrada mais alta aplicável" — é **máximo**, não soma. Somar
 * uma Companhia de Anão + Elfo daria 3 onde o livro dá 2, e o erro cresce com o
 * tamanho do grupo, que é justamente onde ele passa despercebido.
 */
export const TOR_EYE_CULTURE_BASE: Record<TorCultureId, number> = {
  hobbits: 0,
  bardos: 0,
  "homens-de-bri": 0,
  anoes: 1,
  elfos: 2,
  rangers: 2,
  "altos-elfos-de-valfenda": 2,
};

/** VALOR a partir do qual o herói soma 1 à Atenção do Olho inicial. */
export const TOR_EYE_VALOUR_THRESHOLD = 4;

/** Quanto cada Arma ou Armadura Famosa soma. */
export const TOR_EYE_FAMOUS_ITEM_POINTS = 2;

export type TorEyeHero = {
  culture: TorCultureId;
  valour: number;
  /** Armas e Armaduras Famosas que ESTE herói carrega. */
  famousItems?: number;
};

export type TorEyeInitialBreakdown = {
  /** Entrada mais alta da tabela de Culturas. */
  cultureBase: number;
  /** 1 por herói com VALOR 4 ou mais. */
  valourBonus: number;
  /** 2 por Arma ou Armadura Famosa. */
  famousBonus: number;
  total: number;
};

/**
 * "Encontre seu valor básico usando a tabela abaixo (aplique apenas a entrada
 * mais alta aplicável), depois some 1 por cada herói-jogador com VALOR de 4 ou
 * mais. Além disso (…) some 2 por cada Arma e Armadura Famosa."
 *
 * Personagens do Mestre que viajam com a Companhia não entram na conta — por
 * isso a lista é de heróis-jogadores, e quem monta a lista é o Mestre.
 */
export function computeTorInitialEyeAwareness(heroes: readonly TorEyeHero[]): TorEyeInitialBreakdown {
  let cultureBase = 0;
  let valourBonus = 0;
  let famousBonus = 0;

  for (const hero of heroes) {
    cultureBase = Math.max(cultureBase, TOR_EYE_CULTURE_BASE[hero.culture] ?? 0);
    if (hero.valour >= TOR_EYE_VALOUR_THRESHOLD) valourBonus += 1;
    famousBonus += Math.max(0, Math.floor(hero.famousItems ?? 0)) * TOR_EYE_FAMOUS_ITEM_POINTS;
  }

  return { cultureBase, valourBonus, famousBonus, total: cultureBase + valourBonus + famousBonus };
}

/* ══════════════════════════════════════════════════════════════════════
   Fontes de aumento
   ══════════════════════════════════════════════════════════════════════ */

export const TOR_EYE_SOURCES = ["olho-rolado", "sombra", "magia"] as const;
export type TorEyeSource = (typeof TOR_EYE_SOURCES)[number];

export const TOR_EYE_SOURCE_META: Record<
  TorEyeSource,
  { id: TorEyeSource; label: string; defaultPoints: number; description: string }
> = {
  "olho-rolado": {
    id: "olho-rolado",
    label: "Olho rolado fora do combate",
    defaultPoints: 1,
    description:
      "+1 sempre que uma rolagem de jogador fora do combate produzir o Olho, tenha ela passado ou falhado. O Mestre pode subir para 2 ou mais em cena grave, ou anular num lugar seguro.",
  },
  sombra: {
    id: "sombra",
    label: "Sombra ganha fora do combate",
    defaultPoints: 1,
    description: "Sobe em quantidade IGUAL aos pontos de Sombra que o herói ganhou fora do combate.",
  },
  magia: {
    id: "magia",
    label: "Uso de magia",
    defaultPoints: 1,
    description: "+1 efeito menor, +2 feitiço maior, +3 feitiço realmente poderoso.",
  },
};

export function isTorEyeSource(v: unknown): v is TorEyeSource {
  return typeof v === "string" && (TOR_EYE_SOURCES as readonly string[]).includes(v);
}

/**
 * Face física do d12 que representa o Olho de Sauron.
 *
 * É por ela que o gancho automático reconhece um ⊘ numa rolagem: o que trafega
 * do painel para o chat é a FACE (11/12), não o valor de jogo — o Olho vale zero
 * e a Runa vale 10, então olhar o valor não distinguiria o Olho de um zero
 * qualquer.
 *
 * Precisa bater com `featDiePhysicalFace` em lib/character/um-anel/dice.ts; o
 * teste confere os dois lados.
 */
export const TOR_EYE_FEAT_FACE = 11;

/* ══════════════════════════════════════════════════════════════════════
   Limiar da Caçada
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Limiar por região atravessada. Usa o mesmo `TorRegionType` da Jornada de
 * propósito: a região onde a Companhia está é uma coisa só, e duas listas de
 * regiões divergiriam no dia em que uma ganhasse uma entrada.
 */
export const TOR_HUNT_REGION_THRESHOLD: Record<TorRegionType, number> = {
  fronteirica: 18,
  selvagem: 16,
  sombria: 14,
};

export const TOR_HUNT_MODIFIERS = [
  "bencao",
  "discricao",
  "renome",
  "procurados",
] as const;
export type TorHuntModifier = (typeof TOR_HUNT_MODIFIERS)[number];

export const TOR_HUNT_MODIFIER_META: Record<
  TorHuntModifier,
  { id: TorHuntModifier; delta: number; label: string }
> = {
  bencao: {
    id: "bencao",
    delta: 4,
    label: "Protegida pela bênção de um Mago ou personagem poderoso",
  },
  discricao: {
    id: "discricao",
    delta: 2,
    label: "Viaja sob nomes falsos, por caminhos raramente trilhados",
  },
  renome: { id: "renome", delta: -2, label: "Grande renome na área por um feito excepcional" },
  procurados: {
    id: "procurados",
    delta: -4,
    label: "O Inimigo está à procura dos heróis, ou conhece a missão deles",
  },
};

export function isTorHuntModifier(v: unknown): v is TorHuntModifier {
  return typeof v === "string" && (TOR_HUNT_MODIFIERS as readonly string[]).includes(v);
}

export function torHuntThreshold(
  region: TorRegionType,
  modifiers: readonly TorHuntModifier[] = []
): number {
  const base = TOR_HUNT_REGION_THRESHOLD[region];
  const delta = modifiers.reduce((sum, m) => sum + (TOR_HUNT_MODIFIER_META[m]?.delta ?? 0), 0);
  // Nada no livro diz que o limiar tem piso, mas um limiar negativo revelaria a
  // Companhia sem que nada acontecesse — zero é o menor valor com sentido.
  return Math.max(0, base + delta);
}

/**
 * "Enquanto a Atenção do Olho da Companhia for inferior ao limiar da Caçada, os
 * heróis-jogadores são considerados escondidos. Se a Atenção do Olho **igualar
 * ou exceder** o limiar da Caçada, o grupo será revelado."
 *
 * Igualar já revela — usar `>` deixaria a Companhia escondida exatamente no
 * ponto em que o livro manda revelá-la.
 */
export function torIsRevealed(eyeAwareness: number, huntThreshold: number): boolean {
  return eyeAwareness >= huntThreshold;
}

/* ══════════════════════════════════════════════════════════════════════
   Mensagens
   ══════════════════════════════════════════════════════════════════════ */

export function formatTorEyeMessage(opts: {
  before: number;
  after: number;
  threshold: number;
  source?: TorEyeSource;
  reset?: boolean;
}): string {
  if (opts.reset) {
    return (
      `Episódio de Revelação interpretado — a Companhia está escondida de novo. ` +
      `Atenção do Olho volta ao valor inicial (${opts.after}/${opts.threshold})`
    );
  }
  const rotulo = opts.source ? `${TOR_EYE_SOURCE_META[opts.source].label}: ` : "";
  const delta = opts.after - opts.before;
  const sinal = delta >= 0 ? `+${delta}` : String(delta);
  return (
    `${rotulo}Atenção do Olho ${sinal} (${opts.after}/${opts.threshold})` +
    (torIsRevealed(opts.after, opts.threshold)
      ? " · A COMPANHIA FOI REVELADA — o Mestre introduz um episódio de Revelação"
      : "")
  );
}
