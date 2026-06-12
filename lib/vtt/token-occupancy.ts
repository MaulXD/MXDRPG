import type { Axial } from "@/lib/vtt/hex-math";
import { inSquareGrid } from "@/lib/vtt/hex-math";
import {
  creatureSizeOf,
  occupiedHexes,
  type CreatureSize,
} from "@/lib/vtt/creature-size";
import type { BattleToken } from "@/lib/vtt/types";

/** @deprecated Use CreatureSize */
export type TokenFootprint = "medium" | "small";

export function axialKey(a: Axial): string {
  return `${a.q},${a.r}`;
}

export function tokenFootprint(
  token: BattleToken,
  actorRaca?: string | null
): TokenFootprint {
  const size = creatureSizeOf(token, actorRaca);
  return size === "small" ? "small" : "medium";
}

export type HexOccupants = {
  tokenIds: string[];
  sizes: CreatureSize[];
};

export type OccupancyMap = Map<string, HexOccupants>;

export function buildOccupancy(
  tokens: BattleToken[],
  excludeTokenId: string | null,
  sizeOf: (t: BattleToken) => CreatureSize,
  actorRacas: Record<string, string | undefined> = {}
): OccupancyMap {
  const map: OccupancyMap = new Map();
  for (const t of tokens) {
    if (excludeTokenId && t.id === excludeTokenId) continue;
    const size = sizeOf(t);
    const hexes = occupiedHexes(t.axial, size);
    for (const hex of hexes) {
      const key = axialKey(hex);
      const prev = map.get(key);
      if (prev) {
        prev.tokenIds.push(t.id);
        prev.sizes.push(size);
      } else {
        map.set(key, { tokenIds: [t.id], sizes: [size] });
      }
    }
  }
  return map;
}

export function inGrid(hex: Axial, gridRadius: number): boolean {
  return inSquareGrid(hex, gridRadius);
}

const MAX_SMALL_PER_CELL = 2;

function cellAllowsMover(
  hex: Axial,
  moverSize: CreatureSize,
  occupancy: OccupancyMap
): boolean {
  const occ = occupancy.get(axialKey(hex));
  if (!occ || occ.tokenIds.length === 0) return true;
  if (moverSize !== "small") return false;
  return (
    occ.tokenIds.length < MAX_SMALL_PER_CELL &&
    occ.sizes.every((s) => s === "small")
  );
}

/** Pode ancorar o token nesta célula (todos os hexes do corpo devem caber). */
export function canEnterHex(
  anchor: Axial,
  moverSize: CreatureSize,
  occupancy: OccupancyMap,
  gridRadius: number
): boolean {
  const body = occupiedHexes(anchor, moverSize);
  for (const hex of body) {
    if (!inGrid(hex, gridRadius)) return false;
    if (!cellAllowsMover(hex, moverSize, occupancy)) return false;
  }
  return true;
}

export function occupancyContext(
  tokens: BattleToken[],
  mover: BattleToken,
  actorRacas: Record<string, string | undefined> = {}
): {
  occupancy: OccupancyMap;
  moverSize: CreatureSize;
  sizeOf: (t: BattleToken) => CreatureSize;
} {
  const moverRaca = mover.actorId ? actorRacas[mover.actorId] : undefined;
  const sizeOf = (t: BattleToken): CreatureSize => {
    const raca = t.actorId ? actorRacas[t.actorId] : undefined;
    return creatureSizeOf(t, raca);
  };
  return {
    occupancy: buildOccupancy(tokens, mover.id, sizeOf, actorRacas),
    moverSize: creatureSizeOf(mover, moverRaca),
    sizeOf,
  };
}
