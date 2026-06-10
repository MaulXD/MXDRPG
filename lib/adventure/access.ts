import type { Adventure } from "@/lib/adventure/types";

export type AdventureAccessMode = "public" | "closed";

export function isAdventurePublic(adv: Pick<Adventure, "accessMode">): boolean {
  return (adv.accessMode ?? "public") === "public";
}

export function isAdventureClosed(adv: Pick<Adventure, "accessMode">): boolean {
  return adv.accessMode === "closed";
}
