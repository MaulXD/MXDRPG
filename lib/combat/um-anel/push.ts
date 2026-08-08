/**
 * Empurrão — "rolar com o golpe" (06-fases-de-aventura-combate.md §Empurrão).
 *
 * > Uma vez por rodada, heróis-jogadores podem **reduzir à metade a perda de
 * > Resistência** causada por um ataque bem-sucedido (arredondando frações para
 * > cima) escolhendo ser **empurrados**: eles gastarão sua próxima ação
 * > principal recuperando sua posição de combate.
 *
 * "Adversários não podem escolher ser empurrados."
 *
 * O arredondamento é **da perda que fica**, não do que é devolvido: perder 7 e
 * "reduzir à metade arredondando para cima" deixa 4 de perda, devolvendo 3.
 * Arredondar para baixo devolveria 4 e daria meio ponto de vantagem em toda
 * perda ímpar.
 */

/** Quanto de Resistência o herói recupera ao aceitar ser empurrado. */
export function torPushRecovery(loss: number): number {
  const perda = Math.max(0, Math.floor(loss));
  const reduzida = Math.ceil(perda / 2);
  return perda - reduzida;
}

/** A oferta ainda vale? Uma vez por rodada, e só na rodada em que o golpe caiu. */
export function torPushAvailable(params: {
  offer?: { loss: number; round: number };
  pushedRound?: number;
  round: number;
}): boolean {
  if (!params.offer) return false;
  if (params.offer.round !== params.round) return false;
  if (params.pushedRound === params.round) return false;
  return torPushRecovery(params.offer.loss) > 0;
}
