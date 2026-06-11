import type { CharacterSheet, InventoryItem } from "@/lib/character/types";
import { getEntry } from "@/lib/compendium/registry";
import { entryDescriptionHtml, stripHtml } from "@/lib/compendium/format";
import { rollDice, type DiceResult } from "@/lib/dice/roll";
import {
  applyConsumableBuffs,
  consumableEffectDef,
  consumableHealFormula,
  CONSUMABLE_CATALOG_EFFECTS,
} from "@/lib/combat/consumable-effects";
import type { CombatTickContext } from "@/lib/combat/timed-effects";
import { PA_DEFAULT_ACTION_COST } from "@/lib/combat/pa-economy";
import { canActOnCombatTurn, TURN_WAIT_MSG } from "@/lib/combat/turn-guard";
import { checkCanSpendPa } from "@/lib/combat/pa-turn";
import type { CombatTrack } from "@/lib/room/combat";
import type { BattleToken } from "@/lib/vtt/types";

export type ActorConsumable = {
  instanceId: string;
  entryId: string;
  catalogId: string;
  name: string;
  quantity: number;
  description: string;
  healFormula?: string;
  effectHint?: string;
};

export type ConsumableUseResult = {
  paCost: number;
  summary: string;
  detail: string;
  healRoll?: DiceResult;
  hpBefore: number;
  hpAfter: number;
  inventory: InventoryItem[];
  tokenPatch: Partial<BattleToken>;
};

function catalogIdFromEntry(system: Record<string, unknown>): string {
  return system.catalogId != null ? String(system.catalogId) : "";
}

function isPotionCatalogId(catalogId: string): boolean {
  return catalogId.startsWith("POC-") && Boolean(CONSUMABLE_CATALOG_EFFECTS[catalogId]);
}

export function listActorConsumables(actor: CharacterSheet): ActorConsumable[] {
  const out: ActorConsumable[] = [];

  for (const item of actor.inventory) {
    if (item.quantity <= 0) continue;
    if (item.packId !== "equipamentos" && item.packId !== "consumiveis") continue;

    const entry = getEntry(item.packId, item.entryId);
    if (!entry) continue;

    const catalogId = catalogIdFromEntry(entry.system);
    if (item.packId === "consumiveis") {
      if (!catalogId || !consumableEffectDef(catalogId)) continue;
    } else {
      if (entry.system.consumable !== true) continue;
      if (!isPotionCatalogId(catalogId)) continue;
    }

    const def = consumableEffectDef(catalogId);
    const description = stripHtml(entryDescriptionHtml(entry.system));
    out.push({
      instanceId: item.instanceId,
      entryId: item.entryId,
      catalogId,
      name: entry.name,
      quantity: item.quantity,
      description,
      healFormula: consumableHealFormula(catalogId),
      effectHint: def?.hint,
    });
  }

  return out.sort((a, b) => a.name.localeCompare(b.name, "pt"));
}

export function consumablePaCost(): number {
  return PA_DEFAULT_ACTION_COST;
}

export function canUseConsumable(
  token: BattleToken,
  combat: CombatTrack | null | undefined,
  activeTokenId: string | null | undefined,
  bypassTurn?: boolean
): { ok: true } | { ok: false; reason: string } {
  if (!token.linked || !token.actorId) {
    return { ok: false, reason: "Token sem ficha vinculada" };
  }
  if (!canActOnCombatTurn(token.id, {
    combat,
    activeTokenId,
    bypassTurn,
    combatHasOrder: Boolean(combat?.order?.length),
  })) {
    return { ok: false, reason: TURN_WAIT_MSG };
  }
  const paCost = consumablePaCost();
  const paCheck = checkCanSpendPa(token, paCost);
  if (!paCheck.ok) return { ok: false, reason: paCheck.reason ?? "PA insuficientes" };
  return { ok: true };
}

function decrementInventory(
  inventory: InventoryItem[],
  instanceId: string
): InventoryItem[] {
  return inventory
    .map((item) =>
      item.instanceId === instanceId ? { ...item, quantity: item.quantity - 1 } : item
    )
    .filter((item) => item.quantity > 0);
}

export function resolveConsumableUse(
  token: BattleToken,
  actor: CharacterSheet,
  consumable: ActorConsumable,
  ctx: CombatTickContext = { round: 1, activeIndex: 0 }
): ConsumableUseResult {
  const item = actor.inventory.find((i) => i.instanceId === consumable.instanceId);
  if (!item || item.quantity <= 0) {
    throw new Error("Item não encontrado no inventário");
  }

  const hpBefore = token.vida ?? actor.resources.vida.value;
  const hpMax = token.vidaMax ?? actor.resources.vida.max;
  let hpAfter = hpBefore;
  let healRoll: DiceResult | undefined;
  let workingToken: BattleToken = { ...token };
  const effectNotes: string[] = [];

  const healFormula = consumable.healFormula ?? consumableHealFormula(consumable.catalogId);
  if (healFormula) {
    healRoll = rollDice(healFormula);
    hpAfter = Math.min(hpMax, hpBefore + healRoll.total);
    effectNotes.push(
      `Cura ${healRoll.total} HP (${healRoll.rolls.join(", ")}${healRoll.modifier >= 0 ? `+${healRoll.modifier}` : healRoll.modifier})`
    );
  }

  const buffResult = applyConsumableBuffs(workingToken, consumable.catalogId, ctx);
  workingToken = buffResult.token;
  effectNotes.push(...buffResult.notes);

  if (!healRoll && effectNotes.length === 0) {
    const def = consumableEffectDef(consumable.catalogId);
    effectNotes.push(def?.hint ?? consumable.description.split(".")[0]?.trim() ?? consumable.name);
  }

  const inventory = decrementInventory(actor.inventory, consumable.instanceId);
  const detail = effectNotes.join(" · ") || consumable.description;
  const summary =
    healRoll != null
      ? `${actor.name} bebe ${consumable.name} — +${healRoll.total} HP (${hpBefore}→${hpAfter})`
      : `${actor.name} usa ${consumable.name} — ${detail}`;

  const tokenPatch: Partial<BattleToken> = {};
  const buffFields = [
    "conditions",
    "timedEffects",
    "defesaBonus",
    "defesaBuffSource",
    "bonusDamageFormula",
    "saveAdvantagePoison",
  ] as const;
  for (const field of buffFields) {
    const beforeVal = token[field];
    const afterVal = workingToken[field];
    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      (tokenPatch as Record<string, unknown>)[field] = afterVal;
    }
  }

  return {
    paCost: consumablePaCost(),
    summary,
    detail,
    healRoll,
    hpBefore,
    hpAfter,
    inventory,
    tokenPatch,
  };
}
