import type { BattleToken } from "@/lib/vtt/types";

export type PortraitFrameTier = "hero" | "monster" | "elite" | "miniboss" | "boss";

export function getPortraitFrameClass(tier: PortraitFrameTier): string {
  const map: Record<PortraitFrameTier, string> = {
    hero: "portrait-frame--hero",
    monster: "portrait-frame--monster",
    elite: "portrait-frame--elite",
    miniboss: "portrait-frame--miniboss",
    boss: "portrait-frame--boss",
  };
  return map[tier];
}

/** Resolve moldura v4 a partir do token na mesa. */
export function resolvePortraitFrameTier(token: BattleToken): PortraitFrameTier {
  const isMonster = Boolean(
    token.monsterTier || token.monsterEntryId || token.gmCreationId
  );
  if (!isMonster) return "hero";
  if (token.monsterVariant === "elite") return "elite";
  switch (token.monsterTier) {
    case "boss":
      return "boss";
    case "mini":
      return "miniboss";
    default:
      return "monster";
  }
}
