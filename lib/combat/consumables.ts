import type { CharacterSheet, InventoryItem } from "@/lib/character/types";
import { getEntry } from "@/lib/compendium/registry";
import { entryDescriptionHtml, stripHtml } from "@/lib/compendium/format";
import { rollDice, type DiceResult } from "@/lib/dice/roll";
import { hasCondition, toggleTokenCondition, type TokenCondition } from "@/lib/combat/conditions";
import { PA_DEFAULT_ACTION_COST } from "@/lib/combat/pa-economy";
import { canActOnCombatTurn, TURN_WAIT_MSG } from "@/lib/combat/turn-guard";
import { checkCanSpendPa } from "@/lib/combat/pa-turn";
import type { CombatTrack } from "@/lib/room/combat";
import type { BattleToken } from "@/lib/vtt/types";

/** Fórmulas de cura por ID de catálogo (POC-01 … POC-24). */
const POTION_HEAL_FORMULA: Record<string, string> = {
  "POC-01": "2d4+2",
  "POC-02": "4d4+4",
  "POC-03": "8d4+8",
  "POC-23": "1d8",
};

/** Efeitos mecânicos simples além de cura. */
const POTION_CLEAR_CONDITION: Record<string, TokenCondition> = {
  "POC-04": "envenenado",
};

export type ActorConsumable = {
  instanceId: string;
  entryId: string;
  catalogId: string;
  name: string;
  quantity: number;
  description: string;
  healFormula?: string;
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
  return catalogId.startsWith("POC-");
}

export function listActorConsumables(actor: CharacterSheet): ActorConsumable[] {
  const out: ActorConsumable[] = [];

  for (const item of actor.inventory) {
    if (item.packId !== "equipamentos" || item.quantity <= 0) continue;
    const entry = getEntry("equipamentos", item.entryId);
    if (!entry) continue;
    if (entry.system.consumable !== true) continue;

    const catalogId = catalogIdFromEntry(entry.system);
    if (!isPotionCatalogId(catalogId)) continue;

    const description = stripHtml(entryDescriptionHtml(entry.system));
    out.push({
      instanceId: item.instanceId,
      entryId: item.entryId,
      catalogId,
      name: entry.name,
      quantity: item.quantity,
      description,
      healFormula: POTION_HEAL_FORMULA[catalogId],
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
  consumable: ActorConsumable
): ConsumableUseResult {
  const item = actor.inventory.find((i) => i.instanceId === consumable.instanceId);
  if (!item || item.quantity <= 0) {
    throw new Error("Item não encontrado no inventário");
  }

  const hpBefore = token.vida ?? actor.resources.vida.value;
  const hpMax = token.vidaMax ?? actor.resources.vida.max;
  let hpAfter = hpBefore;
  let healRoll: DiceResult | undefined;
  let tokenPatch: Partial<BattleToken> = {};
  const effectNotes: string[] = [];

  if (consumable.healFormula) {
    healRoll = rollDice(consumable.healFormula);
    hpAfter = Math.min(hpMax, hpBefore + healRoll.total);
    effectNotes.push(
      `Cura ${healRoll.total} HP (${healRoll.rolls.join(", ")}${healRoll.modifier >= 0 ? `+${healRoll.modifier}` : healRoll.modifier})`
    );
  }

  const clearCond = POTION_CLEAR_CONDITION[consumable.catalogId];
  if (clearCond && hasCondition(token, clearCond)) {
    tokenPatch = {
      ...tokenPatch,
      conditions: toggleTokenCondition({ ...token, ...tokenPatch }, clearCond),
    };
    effectNotes.push(`Remove ${clearCond}`);
  }

  if (!consumable.healFormula && !clearCond) {
    const short = consumable.description.split(".")[0]?.trim() || consumable.name;
    effectNotes.push(short);
  }

  const inventory = decrementInventory(actor.inventory, consumable.instanceId);
  const detail = effectNotes.join(" · ") || consumable.description;
  const summary =
    healRoll != null
      ? `${actor.name} bebe ${consumable.name} — +${healRoll.total} HP (${hpBefore}→${hpAfter})`
      : `${actor.name} usa ${consumable.name} — ${detail}`;

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
