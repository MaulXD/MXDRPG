import { rollDice } from "@/lib/dice/roll";
import type { DamageBreakdown } from "@/lib/combat/attack";

export type EquipmentSpecialTrigger = "onHit" | "onCrit" | "whileEquipped";

export type EquipmentSpecialKind = "healSelf" | "bonusDamage" | "narrative";

export type EquipmentSpecial = {
  effectId: string;
  trigger: EquipmentSpecialTrigger;
  kind: EquipmentSpecialKind;
  amount?: number;
  formula?: string;
  damageType?: string;
  label?: string;
};

export type EquipmentHitOutcome = {
  attackerHeal: number;
  bonusDamage: number;
  notes: string[];
};

type RawSpecial = EquipmentSpecial | { effects: EquipmentSpecial[] };

export function normalizeWeaponSpecial(raw: unknown): EquipmentSpecial[] {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as RawSpecial;
  if ("effects" in obj && Array.isArray(obj.effects)) {
    return obj.effects.filter((e) => e.kind !== "narrative");
  }
  const single = obj as EquipmentSpecial;
  if (single.kind === "narrative") return [];
  if (single.effectId && single.trigger && single.kind) return [single];
  return [];
}

export function applyEquipmentOnHitEffects(
  specials: EquipmentSpecial[],
  hit: boolean,
  critical: boolean
): EquipmentHitOutcome {
  const out: EquipmentHitOutcome = { attackerHeal: 0, bonusDamage: 0, notes: [] };
  if (!hit) return out;

  for (const s of specials) {
    const fires =
      s.trigger === "onHit" || (s.trigger === "onCrit" && critical);
    if (!fires) continue;

    if (s.kind === "healSelf" && s.amount) {
      out.attackerHeal += s.amount;
      out.notes.push(s.label ?? s.effectId);
    }
    if (s.kind === "bonusDamage" && s.formula) {
      const rolled = rollDice(s.formula);
      out.bonusDamage += rolled.total;
      out.notes.push(
        `${s.label ?? s.effectId} +${rolled.total} ${s.damageType ?? ""}`.trim()
      );
    }
  }
  return out;
}

export function mergeBonusIntoDamage(
  damage: DamageBreakdown,
  bonus: number,
  notes: string[]
): DamageBreakdown {
  if (bonus <= 0) return damage;
  return {
    ...damage,
    rolls: [...damage.rolls, bonus],
    total: damage.total + bonus,
    formula: notes.length
      ? `${damage.formula} + especial (${notes.join(", ")})`
      : `${damage.formula} + especial`,
  };
}

export function appendHealToSummary(
  summary: string,
  heal: number,
  sourceLabel?: string
): string {
  if (heal <= 0) return summary;
  const src = sourceLabel?.trim();
  return src
    ? `${summary} · recupera +${heal} HP (${src})`
    : `${summary} · recupera +${heal} HP`;
}
