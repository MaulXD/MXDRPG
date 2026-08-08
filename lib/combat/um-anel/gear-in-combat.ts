/**
 * Equipamento trocado NO MEIO do combate — hoje, o Elmo.
 *
 * O livro trata isso como jogada tática, não como detalhe de ficha:
 *
 * > "O valor de PROTEÇÃO de uma armadura é anotado separadamente daquele de um
 * > elmo (pois, às vezes, durante o combate, um herói pode recorrer a descartá-lo
 * > para reduzir a Carga carregada e evitar ficar Exausto muito cedo)."
 * > (03-aventureiros.md)
 *
 * E as duas metades custam ações **diferentes**:
 *
 * - tirar é **ação secundária**: "Remover um elmo ou soltar um escudo ou arma,
 *   por exemplo para reduzir a Carga";
 * - recuperar é **ação principal**: "Recuperar sua arma, elmo ou escudo que foi
 *   derrubado anteriormente" (06-fases-de-aventura-combate.md).
 *
 * Tratar as duas como a mesma coisa apagaria o custo da volta, que é o que
 * equilibra a jogada: sair do Exausto é barato, voltar ao Elmo é caro.
 *
 * Funções puras, sem import de runtime.
 */

/** Que ação cada metade custa, no vocabulário do capítulo 6. */
export const TOR_HELM_REMOVE_ACTION = "secundária";
export const TOR_HELM_RECOVER_ACTION = "principal";

export type TorHelmSwapResult = {
  /** O herói passa a usar Elmo? */
  wearing: boolean;
  /** Carga total (equipamento + Fadiga) depois da troca. */
  load: number;
  /** Quanto a Carga mudou. Negativo ao tirar. */
  loadDelta: number;
  /** Dados de Proteção depois da troca. */
  protectionDice: number;
  /** Quanto a Proteção mudou. Negativo ao tirar. */
  protectionDelta: number;
  /** Estava Exausto antes? */
  wearyBefore: boolean;
  /** Está Exausto depois? */
  wearyAfter: boolean;
  /** Qual ação isto custa na rodada. */
  action: string;
};

/**
 * Junta as duas consequências da troca num resultado só.
 *
 * Recebe as Cargas e Proteções já calculadas porque as tabelas de armadura vivem
 * em `data.ts` (import de runtime) — aqui fica a regra, que é: as duas mudam
 * **juntas**, e o Exausto é recalculado com a Carga nova.
 *
 * A Carga que decide Exausto é a **total**: equipamento + Fadiga. Comparar só com
 * a do equipamento é o bug que a Fadiga já sofreu uma vez.
 */
export function torHelmSwap(params: {
  wearingBefore: boolean;
  equipmentLoadBefore: number;
  equipmentLoadAfter: number;
  fatigue: number;
  protectionBefore: number;
  protectionAfter: number;
  enduranceValue: number;
}): TorHelmSwapResult {
  const fadiga = Math.max(0, params.fatigue);
  const totalBefore = Math.max(0, params.equipmentLoadBefore) + fadiga;
  const totalAfter = Math.max(0, params.equipmentLoadAfter) + fadiga;

  return {
    wearing: !params.wearingBefore,
    load: totalAfter,
    loadDelta: totalAfter - totalBefore,
    protectionDice: params.protectionAfter,
    protectionDelta: params.protectionAfter - params.protectionBefore,
    wearyBefore: params.enduranceValue <= totalBefore,
    wearyAfter: params.enduranceValue <= totalAfter,
    action: params.wearingBefore ? TOR_HELM_REMOVE_ACTION : TOR_HELM_RECOVER_ACTION,
  };
}

export function formatTorHelmMessage(heroName: string, r: TorHelmSwapResult): string {
  const verbo = r.wearing ? "recupera o Elmo" : "tira o Elmo";
  const partes = [
    `${heroName} ${verbo} (ação ${r.action})`,
    `Carga total ${r.load}`,
    `Proteção ${r.protectionDice}d`,
  ];
  // O que a mesa quer saber é a VIRADA, não o estado — por isso só sai quando
  // muda de fato.
  if (r.wearyBefore && !r.wearyAfter) partes.push("deixa de estar EXAUSTO");
  if (!r.wearyBefore && r.wearyAfter) partes.push("fica EXAUSTO");
  return partes.join(" · ");
}
