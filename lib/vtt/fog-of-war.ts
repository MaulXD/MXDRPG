import type { Axial } from "@/lib/vtt/grid-math";
import { cellNeighbors } from "@/lib/vtt/grid-math";
import { tokenOccupiedCells } from "@/lib/vtt/creature-size";
import { axialKey } from "@/lib/vtt/token-occupancy";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";

export function cellKey(q: number, r: number): string {
  return axialKey({ q, r });
}

export function revealCellKeys(scene: BattleScene, keys: string[]): BattleScene {
  const set = new Set(scene.revealedCells ?? []);
  for (const k of keys) set.add(k);
  return { ...scene, revealedCells: [...set] };
}

export function revealAxial(scene: BattleScene, axial: Axial): BattleScene {
  return revealCellKeys(scene, [cellKey(axial.q, axial.r)]);
}

/** Células visíveis para jogador (null = tudo visível). */
export function visibleCellSetForPlayer(
  scene: BattleScene,
  tokens: BattleToken[],
  opts: { userId?: string | null; actorIds?: string[] }
): Set<string> | null {
  if (!scene.fogEnabled) return null;

  const set = new Set(scene.revealedCells ?? []);

  for (const token of tokens) {
    const isOwn =
      (opts.userId && token.actorId && opts.actorIds?.includes(token.actorId)) ||
      token.ownerRole === "jogador";
    if (!isOwn) continue;
    for (const cell of tokenOccupiedCells(token)) {
      set.add(cellKey(cell.q, cell.r));
      for (const n of cellNeighbors(cell)) {
        set.add(cellKey(n.q, n.r));
      }
    }
  }

  return set;
}

export function isCellVisibleToPlayer(
  scene: BattleScene,
  q: number,
  r: number,
  visible: Set<string> | null
): boolean {
  if (!visible) return true;
  return visible.has(cellKey(q, r));
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
    return visible.has(cellKey(t.axial.q, t.axial.r));
  });
}
