/**
 * Efeitos que duram uma rodada, no Um Anel.
 *
 * Por que existe separado do `lib/combat/timed-effects.ts`: aquele é do Eldarin
 * e fala em turnos, PA e condições que não existem aqui (inconsciente, trilha de
 * morte). Isolamento de hub — o Um Anel não importa do Eldarin. E a unidade é
 * outra: no Um Anel a rodada é simultânea, então o que dura "uma rodada" não é
 * "até o meu próximo turno".
 *
 * Duas durações diferentes, e o livro é explícito sobre qual é qual:
 *
 * - **até ser usado**: "os oponentes ficam Exaustos em sua *próxima rolagem de
 *   ataque*", "o *próximo ataque* dirigido ao herói protegido perde (1d)",
 *   "ganha (1d) em seu *próximo ataque* à distância". Vale uma vez e acaba,
 *   mesmo que a rodada continue;
 * - **pela rodada**: "ganham (1d) em suas rolagens de ataque *na rodada
 *   seguinte*". Vale em todas as rolagens daquela rodada.
 *
 * Confundir as duas dá vantagem a mais (um bônus de uso único valendo a rodada
 * toda) ou a menos (um bônus de rodada sumindo no primeiro ataque).
 */

export const TOR_ROUND_EFFECTS = [
  /** Intimidar Inimigo — Exausto na próxima rolagem de ataque. */
  "intimidado",
  /** Reunir Companheiros — ganha (Nd) nas rolagens de ataque da rodada. */
  "reunido",
  /** Proteger Companheiro — o próximo ataque contra ele perde (Nd). */
  "protegido",
  /** Preparar Tiro — ganha (Nd) no próximo ataque à distância. */
  "tiro-preparado",
  /**
   * Escrituração, não regra: marca quem já usou Reunir Companheiros nesta
   * rodada. "Apenas um herói-jogador pode escolher Reunir Companheiros em uma
   * dada rodada" — sem uma marca, a mesa inteira usaria a tarefa toda rodada.
   */
  "reuniu",
] as const;

export type TorRoundEffectKind = (typeof TOR_ROUND_EFFECTS)[number];

export type TorRoundEffect = {
  kind: TorRoundEffectKind;
  /** Dados de Sucesso somados (ou subtraídos de quem ataca, em `protegido`). */
  dice: number;
  /** Última rodada em que o efeito ainda vale (inclusive). */
  untilRound: number;
  /** De quem veio — vai para a mensagem, para a mesa poder conferir. */
  source?: string;
};

/** Efeitos que valem UMA vez e somem ao serem usados. */
const CONSUME_ON_USE: Record<TorRoundEffectKind, boolean> = {
  intimidado: true,
  reunido: false,
  protegido: true,
  "tiro-preparado": true,
  reuniu: false,
};

export function torRoundEffectIsConsumed(kind: TorRoundEffectKind): boolean {
  return CONSUME_ON_USE[kind];
}

export function isTorRoundEffectKind(v: unknown): v is TorRoundEffectKind {
  return typeof v === "string" && (TOR_ROUND_EFFECTS as readonly string[]).includes(v);
}

/**
 * Acrescenta um efeito, substituindo outro do mesmo tipo.
 *
 * Não empilha de propósito: nenhuma das tarefas manda somar dois "Preparar
 * Tiro". Duas rolagens da mesma tarefa no mesmo alvo valem a melhor — o que
 * também impede o Mestre de acumular "protegido" indefinidamente repetindo a
 * ação.
 */
export function addTorRoundEffect(
  list: readonly TorRoundEffect[] | undefined,
  effect: TorRoundEffect
): TorRoundEffect[] {
  const rest = (list ?? []).filter((e) => e.kind !== effect.kind);
  const anterior = (list ?? []).find((e) => e.kind === effect.kind);
  if (anterior && anterior.dice > effect.dice && anterior.untilRound >= effect.untilRound) {
    return [...rest, anterior];
  }
  return [...rest, effect];
}

/** Remove o que já venceu. Roda na virada de rodada. */
export function pruneTorRoundEffects(
  list: readonly TorRoundEffect[] | undefined,
  round: number
): TorRoundEffect[] {
  return (list ?? []).filter((e) => e.untilRound >= round);
}

export function findTorRoundEffect(
  list: readonly TorRoundEffect[] | undefined,
  kind: TorRoundEffectKind,
  round: number
): TorRoundEffect | undefined {
  return (list ?? []).find((e) => e.kind === kind && e.untilRound >= round);
}

/**
 * Usa um efeito: devolve o efeito encontrado e a lista já sem ele, quando o tipo
 * é de uso único. Tipos de duração ficam onde estão.
 */
export function consumeTorRoundEffect(
  list: readonly TorRoundEffect[] | undefined,
  kind: TorRoundEffectKind,
  round: number
): { effect?: TorRoundEffect; rest: TorRoundEffect[] } {
  const effect = findTorRoundEffect(list, kind, round);
  if (!effect) return { rest: [...(list ?? [])] };
  if (!torRoundEffectIsConsumed(kind)) return { effect, rest: [...(list ?? [])] };
  return { effect, rest: (list ?? []).filter((e) => e !== effect) };
}
