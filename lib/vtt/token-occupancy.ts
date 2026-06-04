import type { Axial } from "@/lib/vtt/hex-math";
import { axialDistance } from "@/lib/vtt/hex-math";
import type { BattleToken } from "@/lib/vtt/types";

export type TokenFootprint = "medium" | "small";

/** Raças com Tamanho Pequeno (Livro do Jogador — Halfling, Gnomo) */
const SMALL_RACES = new Set(["Halfling", "Gnomo"]);

export function axialKey(a: Axial): string {
  return `${a.q},${a.r}`;
}

export function tokenFootprint(
  token: BattleToken,
  actorRaca?: string | null
): TokenFootprint {
  if (token.footprint === "small" || token.footprint === "medium") return token.footprint;
  if (token.sharedHex) return "small";
  if (actorRaca && SMALL_RACES.has(actorRaca)) return "small";
  if (token.monsterTier === "mob" && (token.walk ?? 99) <= 3) return "small";
  return "medium";
}

export type HexOccupants = {
  tokenIds: string[];
  footprints: TokenFootprint[];
};

export type OccupancyMap = Map<string, HexOccupants>;

export function buildOccupancy(
  tokens: BattleToken[],
  excludeTokenId: string | null,
  footprintOf: (t: BattleToken) => TokenFootprint
): OccupancyMap {
  const map: OccupancyMap = new Map();
  for (const t of tokens) {
    if (excludeTokenId && t.id === excludeTokenId) continue;
    const key = axialKey(t.axial);
    const fp = footprintOf(t);
    const prev = map.get(key);
    if (prev) {
      prev.tokenIds.push(t.id);
      prev.footprints.push(fp);
    } else {
      map.set(key, { tokenIds: [t.id], footprints: [fp] });
    }
  }
  return map;
}

export function inGrid(hex: Axial, gridRadius: number): boolean {
  return axialDistance({ q: 0, r: 0 }, hex) <= gridRadius;
}

/** Pode o token entrar neste hex (destino), dado quem já ocupa. */
export function canEnterHex(
  hex: Axial,
  moverFootprint: TokenFootprint,
  occupancy: OccupancyMap,
  gridRadius: number
): boolean {
  if (!inGrid(hex, gridRadius)) return false;
  const occ = occupancy.get(axialKey(hex));
  if (!occ || occ.tokenIds.length === 0) return true;

  if (moverFootprint === "medium") return false;

  const hasMedium = occ.footprints.some((f) => f === "medium");
  if (hasMedium) return false;
  const smallCount = occ.footprints.filter((f) => f === "small").length;
  return smallCount < 2;
}

export function occupancyContext(
  tokens: BattleToken[],
  mover: BattleToken,
  actorRacas: Record<string, string | undefined> = {}
): {
  occupancy: OccupancyMap;
  moverFootprint: TokenFootprint;
  footprintOf: (t: BattleToken) => TokenFootprint;
} {
  const moverRaca = mover.actorId ? actorRacas[mover.actorId] : undefined;
  const footprintOf = (t: BattleToken): TokenFootprint => {
    const raca = t.actorId ? actorRacas[t.actorId] : undefined;
    return tokenFootprint(t, raca);
  };
  return {
    occupancy: buildOccupancy(tokens, mover.id, footprintOf),
    moverFootprint: tokenFootprint(mover, moverRaca),
    footprintOf,
  };
}
