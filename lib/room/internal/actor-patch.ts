import { applyIdentityPatch, type IdentityPatch } from "@/lib/character/identity";
import type { CharacterSheet, InventoryItem } from "@/lib/character/types";
import type { CompendiumPackId } from "@/lib/compendium/types";
import { validateImageDataUrl } from "@/lib/media/image-data-url";
import { sanitizePortraitFocus } from "@/lib/media/portrait-focus";

const INVENTORY_PACKS = new Set<CompendiumPackId>([
  "armas",
  "habilidades",
  "magias",
  "equipamentos",
]);

function sanitizeInventory(raw: unknown): InventoryItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: InventoryItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<InventoryItem>;
    if (
      typeof row.instanceId !== "string" ||
      typeof row.entryId !== "string" ||
      typeof row.packId !== "string" ||
      !INVENTORY_PACKS.has(row.packId as CompendiumPackId)
    ) {
      continue;
    }
    const quantity = Math.max(1, Math.floor(Number(row.quantity) || 1));
    out.push({
      instanceId: row.instanceId.slice(0, 80),
      packId: row.packId as CompendiumPackId,
      entryId: row.entryId.slice(0, 120),
      quantity,
    });
  }
  return out;
}

export function sanitizeActorPatch(
  patch: Partial<CharacterSheet> & { identityPatch?: IdentityPatch }
): Partial<CharacterSheet> {
  const out: Partial<CharacterSheet> = {};
  if ("portraitUrl" in patch) {
    out.portraitUrl = validateImageDataUrl(patch.portraitUrl);
  }
  if ("tokenImageUrl" in patch) {
    out.tokenImageUrl = validateImageDataUrl(patch.tokenImageUrl);
  }
  if ("portraitFocus" in patch) {
    out.portraitFocus = sanitizePortraitFocus(patch.portraitFocus);
  }
  if ("coverFocus" in patch) {
    out.coverFocus = sanitizePortraitFocus(patch.coverFocus);
  }
  if ("tokenFocus" in patch) {
    out.tokenFocus = sanitizePortraitFocus(patch.tokenFocus);
  }
  if ("name" in patch && typeof patch.name === "string" && patch.name.trim()) {
    out.name = patch.name.trim().slice(0, 80);
  }
  if ("biography" in patch && typeof patch.biography === "string") {
    out.biography = patch.biography.slice(0, 2000);
  }
  if ("combatLoadout" in patch) {
    const loadout = patch.combatLoadout;
    if (loadout === null) {
      out.combatLoadout = null;
    } else if (
      loadout &&
      typeof loadout === "object" &&
      (loadout.packId === "armas" || loadout.packId === "magias" || loadout.packId === "habilidades") &&
      typeof loadout.entryId === "string"
    ) {
      out.combatLoadout = { packId: loadout.packId, entryId: loadout.entryId.slice(0, 120) };
    }
  }
  if ("armorLoadout" in patch) {
    const armor = patch.armorLoadout;
    if (armor === null) {
      out.armorLoadout = null;
    } else if (
      armor &&
      typeof armor === "object" &&
      armor.packId === "equipamentos" &&
      typeof armor.entryId === "string"
    ) {
      out.armorLoadout = { packId: "equipamentos", entryId: armor.entryId.slice(0, 120) };
    }
  }
  if ("inventory" in patch) {
    const inventory = sanitizeInventory(patch.inventory);
    if (inventory) out.inventory = inventory;
  }
  return out;
}

export function mergeIdentityPatch(
  current: CharacterSheet,
  identityPatch?: IdentityPatch
): CharacterSheet {
  if (!identityPatch) return current;
  return applyIdentityPatch(current, identityPatch);
}
