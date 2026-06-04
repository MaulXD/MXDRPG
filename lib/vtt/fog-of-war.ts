import type { Axial } from "@/lib/vtt/hex-math";
import { hexNeighbors } from "@/lib/vtt/hex-math";
import { axialKey } from "@/lib/vtt/token-occupancy";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";

export function hexKey(q: number, r: number): string {
  return axialKey({ q, r });
}

export function revealHexKeys(scene: BattleScene, keys: string[]): BattleScene {
  const set = new Set(scene.revealedHexes ?? []);
  for (const k of keys) set.add(k);
  return { ...scene, revealedHexes: [...set] };
}

export function revealAxial(scene: BattleScene, axial: Axial): BattleScene {
  return revealHexKeys(scene, [hexKey(axial.q, axial.r)]);
}

/** Hexes visíveis para jogador (null = tudo visível). */
export function visibleHexSetForPlayer(
  scene: BattleScene,
  tokens: BattleToken[],
  opts: { userId?: string | null; actorIds?: string[] }
): Set<string> | null {
  if (!scene.fogEnabled) return null;

  const set = new Set(scene.revealedHexes ?? []);

  for (const token of tokens) {
    const isOwn =
      (opts.userId && token.actorId && opts.actorIds?.includes(token.actorId)) ||
      token.ownerRole === "jogador";
    if (!isOwn) continue;
    set.add(hexKey(token.axial.q, token.axial.r));
    for (const n of hexNeighbors(token.axial)) {
      set.add(hexKey(n.q, n.r));
    }
  }

  return set;
}

export function isHexVisibleToPlayer(
  scene: BattleScene,
  q: number,
  r: number,
  visible: Set<string> | null
): boolean {
  if (!visible) return true;
  return visible.has(hexKey(q, r));
}

export function filterTokensForFog(
  tokens: BattleToken[],
  scene: BattleScene,
  visible: Set<string> | null,
  opts: { userId?: string | null; actorIds?: string[] }
): BattleToken[] {
  if (!visible) return tokens;
  return tokens.filter((t) => {
    const isOwn =
      (opts.userId && t.actorId && opts.actorIds?.includes(t.actorId)) ||
      t.ownerRole === "jogador";
    if (isOwn) return true;
    return visible.has(hexKey(t.axial.q, t.axial.r));
  });
}
