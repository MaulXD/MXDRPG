import type { CombatActionOption } from "@/lib/combat/types";
import {
  DND_RANGED,
  DND_RANGE_SCALE,
  dndLongRangeHex,
  METERS_PER_HEX,
} from "@/lib/vtt/ranged-weapon-range";

const FEET_TO_METERS = 0.3048;

type RangedKind = keyof typeof DND_RANGED;

/** Ataque à distância com arma (não magia/habilidade corpo a corpo). */
export function isRangedWeaponAttack(action: CombatActionOption): boolean {
  if (action.resolution !== "attack") return false;
  if (action.kind === "spell" || action.kind === "ability") return false;
  return action.rangeHex > 1;
}

function rangedKind(action: CombatActionOption): RangedKind | null {
  const id = action.entryId.toLowerCase();
  const name = action.name.toLowerCase();

  if (id.includes("arc-l") || name.includes("arco longo")) return "longbow";
  if (id.includes("arc-c") || name.includes("arco curto")) return "shortbow";
  if (name.includes("besta pesada") || /bst-0[38]/.test(id)) return "heavyCrossbow";
  if (name.includes("besta de mão") || name.includes("besta de mao") || /bst-02/.test(id)) {
    return "handCrossbow";
  }
  if (id.includes("bst-07") || name.includes("besta de alcance")) return "longbow";
  if (id.includes("bst-") || name.includes("besta")) return "lightCrossbow";
  if (name.includes("fund") || name.includes("funda")) return "sling";
  if (name.includes("zarabatana")) return "blowgun";
  if (name.includes("dardo")) return "dart";
  if (name.includes("atirador") || name.includes(" arremess")) return "thrownLight";
  return null;
}

/** Alcance longo SRD (70%) — null se não for tiro com arma. */
export function rangedLongRangeHex(action: CombatActionOption): number | null {
  if (!isRangedWeaponAttack(action)) return null;
  const kind = rangedKind(action);
  if (kind) return dndLongRangeHex(DND_RANGED[kind].long);
  const normalMeters = action.rangeHex * METERS_PER_HEX;
  const normalFeet = normalMeters / (FEET_TO_METERS * DND_RANGE_SCALE);
  return dndLongRangeHex(Math.round(normalFeet * 4));
}

/** Máximo de células para selecionar alvo (normal + faixa longa). */
export function effectiveRangedMaxHex(action: CombatActionOption): number {
  if (!isRangedWeaponAttack(action)) return action.rangeHex;
  return rangedLongRangeHex(action) ?? action.rangeHex;
}

export function isWithinRangedAttackRange(dist: number, action: CombatActionOption): boolean {
  return dist <= effectiveRangedMaxHex(action);
}

/** D&D 5e — além do alcance normal, dentro do longo: desvantagem no ataque. */
export function isRangedLongRange(dist: number, action: CombatActionOption): boolean {
  if (!isRangedWeaponAttack(action)) return false;
  const longMax = rangedLongRangeHex(action);
  if (longMax == null) return false;
  return dist > action.rangeHex && dist <= longMax;
}

export function rangedLongRangeLabel(action: CombatActionOption): string | null {
  const longHex = rangedLongRangeHex(action);
  if (!isRangedWeaponAttack(action) || longHex == null) return null;
  return `${action.rangeHex}/${longHex} cél.`;
}
