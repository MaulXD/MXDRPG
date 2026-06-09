/** Aplica dano consumindo vida temporária antes da vida normal. */
export function applyDamageWithTempHp(
  hp: number,
  tempHp: number,
  damage: number
): { hp: number; tempHp: number } {
  if (damage <= 0) return { hp, tempHp };
  let remaining = damage;
  let temp = Math.max(0, tempHp);
  let current = Math.max(0, hp);
  if (temp > 0) {
    const absorbed = Math.min(temp, remaining);
    temp -= absorbed;
    remaining -= absorbed;
  }
  if (remaining > 0) {
    current = Math.max(0, current - remaining);
  }
  return { hp: current, tempHp: temp };
}
