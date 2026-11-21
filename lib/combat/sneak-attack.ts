import { combatPaPhaseFromFlags } from "@/lib/combat/combat-pa-phase";
import type { RollMode } from "@/lib/combat/d20";
import type { CombatActionKind, CombatTurnOptions } from "@/lib/combat/types";
import { axialDistance } from "@/lib/vtt/grid-math";
import type { BattleToken } from "@/lib/vtt/types";

/**
 * Ataque Furtivo do Ladino (livros/LIVRO-DO-JOGADOR.md, linha 994):
 * "Causa dano bonus (1d6 no nivel 1, crescendo ate 10d6 no nivel 20) ao atacar
 * com Vantagem ou quando um aliado esta adjacente ao alvo."
 *
 * Decisoes do dono (pagina 03 do fichario, D11):
 * - so em ataque com arma (kind "weapon"), nunca em magia, habilidade ou desarmado;
 * - no maximo uma vez por turno do Ladino, so na fase combat_turn (com fila de turnos).
 *   Em combat_free e exploration nao ha turno: o limite nao se aplica e a flag
 *   sneakAttackUsedThisTurn nao e gravada (ver sneakAttackTurnWindow). A flag e zerada
 *   junto com o desconto de PA no inicio do turno;
 * - no critico (livro, linha 421, "dano dobrado") o dado rola de novo, como os dados base da arma.
 *
 * O livro fixa so as pontas da escala. A cadencia do meio (2 em 2 niveis) e a que o
 * motor ja usava em classLevelFeatures.
 *
 * Modulo puro: sem I/O. resolveAttack (lib/combat/attack.ts) usa a formula no
 * servidor; o cliente importa este modulo por rules.ts, que usa so sneakAttackDiceForLevel.
 * Nao e cumulativo: Vantagem e aliado adjacente sao condicoes alternativas, o dado entra uma vez.
 */
export const SNEAK_ATTACK_CLASS = "Ladino";

export function sneakAttackDiceForLevel(level: number): number {
  const nivel = Math.max(1, Math.floor(level));
  return Math.min(10, 1 + Math.floor((nivel - 1) / 2));
}

function isMonsterSide(token: BattleToken): boolean {
  return Boolean(token.monsterEntryId || token.gmCreationId);
}

/** Aliado do atacante adjacente ao alvo: mesmo lado, vivo, outro token que nao o atacante nem o alvo. */
export function hasAdjacentAlly(
  attacker: BattleToken,
  defender: BattleToken,
  allTokens: BattleToken[]
): boolean {
  const attackerIsMonster = isMonsterSide(attacker);
  return allTokens.some(
    (t) =>
      t.id !== attacker.id &&
      t.id !== defender.id &&
      isMonsterSide(t) === attackerIsMonster &&
      (t.vida ?? 0) > 0 &&
      axialDistance(t.axial, defender.axial) <= 1
  );
}

/**
 * Janela do limite "uma vez por turno": so na fase combat_turn, a mesma regra do motor de PA
 * (combatPaPhaseFromFlags). Fora dela nao ha turno e o limite nao se aplica.
 */
export function sneakAttackTurnWindow(turn?: CombatTurnOptions): boolean {
  return (
    combatPaPhaseFromFlags({
      combatActive: turn?.combatActive,
      hasOrder: turn?.combatHasOrder,
    }) === "combat_turn"
  );
}

/**
 * Formula base do dado de Ataque Furtivo (sem dobrar no critico; quem dobra e resolveAttack),
 * ou undefined se nao se aplica. So o Ladino, so ataque com arma; na fase combat_turn,
 * so uma vez por turno (turnWindow = sneakAttackTurnWindow(turn)).
 */
export function sneakAttackFormula(args: {
  classe: string;
  nivel: number;
  rollMode: RollMode;
  actionKind: CombatActionKind;
  attacker: BattleToken;
  defender: BattleToken;
  allTokens: BattleToken[];
  turnWindow: boolean;
}): string | undefined {
  if (args.classe !== SNEAK_ATTACK_CLASS) return undefined;
  if (args.actionKind !== "weapon") return undefined;
  if (args.turnWindow && args.attacker.sneakAttackUsedThisTurn) return undefined;
  const applies =
    args.rollMode === "advantage" ||
    hasAdjacentAlly(args.attacker, args.defender, args.allTokens);
  if (!applies) return undefined;
  return `${sneakAttackDiceForLevel(args.nivel)}d6`;
}
