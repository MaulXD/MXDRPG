import type { RollMode } from "@/lib/combat/d20";
import type { AttackModifier } from "@/lib/combat/types";
import { axialDistance } from "@/lib/vtt/hex-math";
import type { BattleToken } from "@/lib/vtt/types";

const GOBLIN_MONSTER_IDS = new Set([
  "monstros-goblin",
  "monstros-goblin-de-caverna",
]);

export function isGoblinMonster(entryId?: string | null): boolean {
  return Boolean(entryId && GOBLIN_MONSTER_IDS.has(entryId));
}

/** §032 Coordenação de Horda: +1 ataque por goblin adjacente ao alvo (máx +4). */
export function goblinHordeAttackBonus(
  attacker: BattleToken,
  defender: BattleToken,
  allTokens: BattleToken[]
): number {
  if (!isGoblinMonster(attacker.monsterEntryId)) return 0;
  let allies = 0;
  for (const t of allTokens) {
    if (t.id === attacker.id) continue;
    if (!isGoblinMonster(t.monsterEntryId)) continue;
    if ((t.vida ?? 0) <= 0) continue;
    if (axialDistance(t.axial, defender.axial) <= 1) allies += 1;
  }
  return Math.min(4, allies);
}

export function goblinMonsterAttackModifier(
  attacker: BattleToken,
  defender: BattleToken,
  allTokens: BattleToken[]
): AttackModifier | undefined {
  const horde = goblinHordeAttackBonus(attacker, defender, allTokens);
  if (horde <= 0) return undefined;
  return {
    attackBonus: horde,
    label: `horda +${horde}`,
  };
}

/** §032 Ataque Furtivo: +2d6 se o ataque tiver vantagem. */
export function goblinSneakAttackExtra(rollMode: RollMode): string | undefined {
  return rollMode === "advantage" ? "2d6" : undefined;
}
