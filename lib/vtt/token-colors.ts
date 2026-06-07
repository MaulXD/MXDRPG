import type { BattleToken } from "@/lib/vtt/types";
import type { MonsterTier } from "@/lib/vtt/monsters";
import {
  resolvePortraitFrameTier,
  type PortraitFrameTier,
} from "@/lib/vtt/portrait-frame";

const TOKEN_RING_WHITE = "#f5f5f5";

/** Cores de anel por tier v4 (DESIGN-ELDARIN-V4 §4.6) */
const TIER_RING_COLORS: Record<PortraitFrameTier, string> = {
  hero: "#d4a030",
  monster: "#6a5040",
  elite: "#7aa3c9",
  miniboss: "#8060c0",
  boss: "#c0392b",
};

export type TokenRingStyle = {
  kind: "player" | "monster" | "mini-boss" | "boss" | "elite";
  /** Anéis inset na borda do retrato; offset menor = mais externo. */
  rings: Array<{ color: string; width: number; radiusOffset: number }>;
};

export function playerColorForActor(actorId: string, actorIds: string[]): string {
  void actorId;
  void actorIds;
  return TIER_RING_COLORS.hero;
}

export function collectPlayerActorIds(tokens: BattleToken[]): string[] {
  return tokens
    .filter((t) => t.linked && t.ownerRole === "jogador" && t.actorId)
    .map((t) => t.actorId!);
}

/** Quanto o retrato deve encolher para os anéis de identidade não passarem do hex. */
export function tokenPortraitInset(ringStyle: TokenRingStyle): number {
  if (!ringStyle.rings.length) return 0;
  const minOffset = Math.min(...ringStyle.rings.map((ring) => ring.radiusOffset));
  const outerWidth = Math.max(
    ...ringStyle.rings
      .filter((ring) => ring.radiusOffset === minOffset)
      .map((ring) => ring.width)
  );
  return Math.max(0, outerWidth * 0.5 - minOffset);
}

function tierRingStyle(tier: PortraitFrameTier): TokenRingStyle {
  const color = TIER_RING_COLORS[tier];
  const kind: TokenRingStyle["kind"] =
    tier === "hero"
      ? "player"
      : tier === "boss"
        ? "boss"
        : tier === "miniboss"
          ? "mini-boss"
          : tier === "elite"
            ? "elite"
            : "monster";

  if (tier === "boss") {
    return {
      kind,
      rings: [
        { color: TOKEN_RING_WHITE, width: 2, radiusOffset: 0.6 },
        { color, width: 2.5, radiusOffset: 1.8 },
        { color: "#1a1a1a", width: 2, radiusOffset: 3.2 },
      ],
    };
  }

  if (tier === "miniboss") {
    return {
      kind,
      rings: [
        { color: TOKEN_RING_WHITE, width: 2, radiusOffset: 2.5 },
        { color, width: 2.5, radiusOffset: 1 },
        { color: "#2a2040", width: 1.75, radiusOffset: 0 },
      ],
    };
  }

  return {
    kind,
    rings: [
      { color: TOKEN_RING_WHITE, width: 2, radiusOffset: 0.6 },
      { color, width: 2.5, radiusOffset: 2.2 },
    ],
  };
}

export function resolveTokenRing(
  token: BattleToken,
  playerActorIds: string[]
): TokenRingStyle {
  void playerActorIds;
  const tier = resolvePortraitFrameTier(token);
  return tierRingStyle(tier);
}

/** Cor principal do anel de identidade (jogador ou monstro). */
export function primaryTokenRingColor(token: BattleToken, playerActorIds: string[]): string {
  const tier = resolvePortraitFrameTier(token);
  return TIER_RING_COLORS[tier];
}

export function monsterTierLabel(tier: MonsterTier): string {
  if (tier === "boss") return "Boss";
  if (tier === "mini") return "Mini-boss";
  return "Monstro";
}
