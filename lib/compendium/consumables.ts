import type { CompendiumEntry } from "@/lib/compendium/types";

export function isConsumableEntry(entry: Pick<CompendiumEntry, "packId" | "system">): boolean {
  return entry.packId === "consumiveis" || entry.system.consumable === true;
}
