import type { BattleToken } from "@/lib/vtt/types";
import type { MonsterTier } from "@/lib/vtt/monsters";

/** Cores distintas por jogador na mesa */
export const PLAYER_RING_PALETTE = [
  "#4a90d9",
  "#5a7352",
  "#c9a962",
  "#9b59b6",
  "#e67e22",
  "#1abc9c",
  "#e74c3c",
  "#3498db",
] as const;

const MONSTER_RING_RED = "#c62828";
const MONSTER_RING_BLACK = "#1a1a1a";
const TOKEN_RING_WHITE = "#f5f5f5";

export type TokenRingStyle = {
  kind: "player" | "monster" | "mini-boss" | "boss";
  /** Anéis de fora para dentro: [cor, largura] */
  rings: Array<{ color: string; width: number; radiusOffset: number }>;
};

export function playerColorForActor(actorId: string, actorIds: string[]): string {
  const sorted = [...new Set(actorIds)].sort();
  const index = Math.max(0, sorted.indexOf(actorId));
  return PLAYER_RING_PALETTE[index % PLAYER_RING_PALETTE.length];
}

export function collectPlayerActorIds(tokens: BattleToken[]): string[] {
  return tokens
    .filter((t) => t.linked && t.ownerRole === "jogador" && t.actorId)
    .map((t) => t.actorId!);
}

export function resolveTokenRing(
  token: BattleToken,
  playerActorIds: string[]
): TokenRingStyle {
  if (token.linked && token.ownerRole === "jogador" && token.actorId) {
    const color = playerColorForActor(token.actorId, playerActorIds);
    return {
      kind: "player",
      rings: [
        { color: TOKEN_RING_WHITE, width: 2, radiusOffset: 2 },
        { color, width: 2, radiusOffset: 0 },
      ],
    };
  }

  const tier = token.monsterTier ?? "mob";
  if (tier === "boss") {
    return {
      kind: "boss",
      rings: [
        { color: TOKEN_RING_WHITE, width: 2, radiusOffset: 3 },
        { color: MONSTER_RING_RED, width: 2.5, radiusOffset: 1.5 },
        { color: MONSTER_RING_BLACK, width: 2, radiusOffset: 0 },
      ],
    };
  }
  if (tier === "mini") {
    return {
      kind: "mini-boss",
      rings: [
        { color: TOKEN_RING_WHITE, width: 2, radiusOffset: 2.5 },
        { color: MONSTER_RING_RED, width: 2.5, radiusOffset: 1 },
        { color: MONSTER_RING_BLACK, width: 1.75, radiusOffset: 0 },
      ],
    };
  }

  return {
    kind: "monster",
    rings: [
      { color: TOKEN_RING_WHITE, width: 2, radiusOffset: 2 },
      { color: MONSTER_RING_RED, width: 2.5, radiusOffset: 0 },
    ],
  };
}

/** Cor principal do anel de identidade (jogador ou monstro). */
export function primaryTokenRingColor(token: BattleToken, playerActorIds: string[]): string {
  const { rings } = resolveTokenRing(token, playerActorIds);
  return rings[0]?.color ?? token.color;
}

export function monsterTierLabel(tier: MonsterTier): string {
  if (tier === "boss") return "Boss";
  if (tier === "mini") return "Mini-boss";
  return "Monstro";
}
