import type { BattleToken } from "@/lib/vtt/types";

export function normalizeDamageTag(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function isPoisonDamageType(damageType: string): boolean {
  const tag = normalizeDamageTag(damageType);
  return tag.includes("veneno") || tag.includes("toxin");
}

export function tokenResistsDamageType(token: BattleToken, damageType: string): boolean {
  const tags = token.damageResist ?? [];
  if (!tags.length || !damageType.trim()) return false;
  const dt = normalizeDamageTag(damageType);
  return tags.some((t) => {
    const norm = normalizeDamageTag(t);
    return dt.includes(norm) || norm.includes(dt);
  });
}

/** Metade do dano quando há resistência ao tipo (POC-10 … POC-12). */
export function resistedDamageAmount(
  damage: number,
  defender: BattleToken,
  damageType: string
): number {
  if (damage <= 0 || !tokenResistsDamageType(defender, damageType)) return damage;
  return Math.floor(damage / 2);
}
