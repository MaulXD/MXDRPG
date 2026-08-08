import { STARTING_VIRTUES } from "./data";
import { TOR_CULTURAL_VIRTUES } from "./cultural-virtues";

/**
 * Virtudes que **entram na rolagem**.
 *
 * Antes deste módulo, `sheet.virtues` era uma lista de ids decorativa: aparecia
 * na ficha e nada mais. `torVirtueDerivedBonus` (rules.ts) já somava as três
 * Virtudes iniciais de valor fixo às derivadas, mas nenhuma Virtude — inicial ou
 * Cultural — chegava a `rollTorCheck`. O caso que expôs o buraco: Bilbo
 * pré-gerado tem "Certeiro no Alvo" ("todos os seus ataques à distância são
 * Favorecidos") e atirava de arco com uma rolagem normal.
 *
 * Só entram aqui as Virtudes cujo gatilho o servidor consegue decidir sozinho a
 * partir do contexto da rolagem. Ficam de fora, de propósito:
 *
 * - as **opcionais** ("uma vez por combate, você PODE tornar Favorecida") —
 *   Baruk Khazâd!, Coragem Desesperada, Realeza Revelada. Ligar automaticamente
 *   gastaria o uso do jogador sem ele pedir;
 * - as que dependem de **circunstância narrada** pelo Mestre — Escuro pra
 *   Trabalho Escuro (estar no escuro), Caminho de Durin (subterrâneo/aperto),
 *   Memória de Dias Antigos (tabela de Evento de Jornada);
 * - as que concedem **Inspirado**, que não é Favorecida: Inspirado dobra o bônus
 *   de gastar Esperança — *ganha (2d)* em vez de *(1d)* (02-resolucao-de-acoes.md
 *   §INSPIRAÇÃO). Confundir os dois daria dois Dados de Proeza a quem só tem
 *   direito a Dados de Sucesso extras.
 */

/** Contexto de uma rolagem, do ponto de vista das Virtudes. */
export type TorVirtueRollContext =
  | {
      kind: "attack";
      /** Ataque feito com arma à distância. */
      ranged: boolean;
      /** Vigor do alvo (adversário). Ausente/1 = criatura comum. */
      targetMight?: number;
    }
  | { kind: "protection"; miserable?: boolean }
  | { kind: "wound-severity" }
  | { kind: "shadow-test"; source: "pavor" | "outro" };

export type TorVirtueRollEffect = {
  favoured: boolean;
  /** Virtudes que dispararam — vira nota na mensagem do chat. */
  sources: string[];
};

const NONE: TorVirtueRollEffect = { favoured: false, sources: [] };

/**
 * Decide se as Virtudes do herói tornam esta rolagem Favorecida.
 *
 * Recebe ids porque é o que `TorCharacterSheet.virtues` guarda — nunca nomes.
 * Ids desconhecidos são ignorados em silêncio (uma ficha antiga pode carregar
 * id de Virtude que ainda não existe no código).
 */
export function torVirtueRollEffect(
  virtueIds: readonly string[],
  ctx: TorVirtueRollContext
): TorVirtueRollEffect {
  if (!virtueIds || virtueIds.length === 0) return NONE;
  const has = (id: string) => virtueIds.includes(id);
  const sources: string[] = [];

  if (ctx.kind === "attack") {
    // "Todos os seus ataques à distância são Favorecidos."
    // (05-valor-e-sabedoria.md §CERTEIRO NO ALVO)
    if (ctx.ranged && has("certeiro-no-alvo")) sources.push("Certeiro no Alvo");
    // "Quando você está lutando contra criaturas com Vigor (Might) 2 ou mais,
    // todas as suas rolagens de ataque são Favorecidas."
    // (05-valor-e-sabedoria.md §MATADOR DE DRAGÕES)
    if ((ctx.targetMight ?? 1) >= 2 && has("matador-de-dragoes")) {
      sources.push("Matador de Dragões");
    }
  }

  if (ctx.kind === "protection") {
    // "Todas as suas rolagens de PROTEÇÃO são Favorecidas, desde que você não
    // esteja Arrasado." (05-valor-e-sabedoria.md §DURO COMO PEDRA)
    // O "desde que" é o único caso em que Arrasado mexe em Favorecida — e mexe
    // tirando, não pondo: não confundir com Desfavorecido, que é outra condição.
    if (!ctx.miserable && has("duro-como-pedra")) sources.push("Duro como Pedra");
  }

  if (ctx.kind === "wound-severity") {
    // "Ao rolar Severidade de Ferida, role 2 Dados de Proeza e fique com o
    // melhor" — que é exatamente a definição de Favorecida.
    // (05-valor-e-sabedoria.md §DURO COMO RAIZ VELHA)
    if (has("duro-como-raiz-velha")) sources.push("Duro como Raiz Velha");
  }

  if (ctx.kind === "shadow-test" && ctx.source === "pavor") {
    // "Todos os seus Testes de Sombra devidos a Pavor são Favorecidos."
    // (05-valor-e-sabedoria.md §CONTRA O INVISÍVEL). O *ganha (1d)* extra contra
    // espírito/fantasma é Dado de Sucesso e depende de o Mestre dizer o que é a
    // fonte — fica de fora até haver esse dado no contexto.
    if (has("contra-o-invisivel")) sources.push("Contra o Invisível");
  }

  return sources.length > 0 ? { favoured: true, sources } : NONE;
}

/**
 * Proficiências de Combate cujo uso é sempre à distância.
 *
 * A rolagem avulsa da ficha (`rollTorCombatProficiencyCheck`) só conhece a
 * Proficiência, não a arma — e Arcos é a única em que toda arma da tabela tem
 * `ranged: true`. Lanças têm arremesso opcional (`thrown`), então não entram:
 * favorecer todas as Lanças daria a Virtude de graça no corpo a corpo.
 */
export const TOR_RANGED_PROFICIENCIES = ["arcos"] as const;

/** Descrição de uma Virtude por id — inicial **ou** Cultural. */
export type TorVirtueInfo = { id: string; label: string; description: string };

const VIRTUE_INFO_BY_ID: Record<string, TorVirtueInfo> = {
  ...Object.fromEntries(
    STARTING_VIRTUES.map((v) => [v.id, { id: v.id, label: v.label, description: v.description }])
  ),
  ...Object.fromEntries(
    TOR_CULTURAL_VIRTUES.map((v) => [v.id, { id: v.id, label: v.name, description: v.description }])
  ),
};

/**
 * Resolve o id gravado na ficha para exibição.
 *
 * Existe porque a ficha e o PDF resolviam só contra `STARTING_VIRTUES`: uma
 * Virtude Cultural gravada na ficha **sumia da tela** (o `filter(Boolean)`
 * engolia), e o PDF imprimia o id cru ("agilidade-de-aparar") em vez do nome.
 * Id desconhecido volta com o próprio id como rótulo — some da tela nunca mais.
 */
export function torVirtueInfo(id: string): TorVirtueInfo {
  return VIRTUE_INFO_BY_ID[id] ?? { id, label: id, description: "" };
}
