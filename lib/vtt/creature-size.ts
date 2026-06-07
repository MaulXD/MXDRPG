import type { Axial } from "@/lib/vtt/hex-math";
import { HEX_DIRECTIONS, axialDistance, axialToPixel, hexesInRange } from "@/lib/vtt/hex-math";
import type { BattleToken } from "@/lib/vtt/types";
import { resolveMonsterCreatureSize } from "@/lib/vtt/monster-sizes";
import type { MonsterSpawnVariant } from "@/lib/vtt/monster-scaling";

/** Tamanho corporal no grid hex (Livro do Jogador — VTT). */
export type CreatureSize =
  | "small"
  | "medium"
  | "large"
  | "huge"
  | "gargantuan"
  | "colossal";

const SMALL_RACES = new Set(["Halfling", "Gnomo"]);

/** Hexes ocupados por tamanho (Médio 1 · Grande 3 · Gigante 7 · …). */
export const SIZE_HEX_COUNT: Record<CreatureSize, number> = {
  small: 1,
  medium: 1,
  large: 3,
  huge: 7,
  gargantuan: 19,
  colossal: 37,
};

const SIZE_ORDER: CreatureSize[] = [
  "small",
  "medium",
  "large",
  "huge",
  "gargantuan",
  "colossal",
];

/** Raio do disco hexagonal (0 = só centro; 1 = centro + 6 vizinhos = 7 hex). */
function axialDiskRadius(size: CreatureSize): number {
  switch (size) {
    case "small":
    case "medium":
      return 0;
    case "huge":
      return 1;
    case "gargantuan":
      return 2;
    case "colossal":
      return 3;
    default:
      return 0;
  }
}

/** Grande: cluster triangular de 3 hex (âncora + dois vizinhos adjacentes entre si). */
function largeOccupiedHexes(anchor: Axial): Axial[] {
  const a = HEX_DIRECTIONS[0];
  const b = HEX_DIRECTIONS[1];
  return [
    anchor,
    { q: anchor.q + a.q, r: anchor.r + a.r },
    { q: anchor.q + b.q, r: anchor.r + b.r },
  ];
}

export function occupiedHexes(anchor: Axial, size: CreatureSize): Axial[] {
  if (size === "large") return largeOccupiedHexes(anchor);
  return hexesInRange(anchor, axialDiskRadius(size));
}

/** @deprecated Use resolveMonsterCreatureSize com entryId */
export function inferMonsterCreatureSize(
  name: string,
  opts?: { walk?: number; tier?: string; variant?: MonsterSpawnVariant; entryId?: string }
): CreatureSize {
  if (opts?.entryId) {
    return resolveMonsterCreatureSize(opts.entryId, name, opts);
  }
  const lower = name.toLowerCase();
  if (lower.includes("goblin")) return "small";
  if (opts?.tier === "mob" && (opts.walk ?? 99) <= 3) return "small";
  return "medium";
}

export function bumpCreatureSize(size: CreatureSize, steps = 1): CreatureSize {
  const index = SIZE_ORDER.indexOf(size);
  if (index < 0) return size;
  return SIZE_ORDER[Math.min(SIZE_ORDER.length - 1, index + steps)] ?? size;
}

export function creatureSizeOf(token: BattleToken, actorRaca?: string | null): CreatureSize {
  if (token.creatureSize) return token.creatureSize;
  if (token.footprint === "small") return "small";
  if (token.sharedHex) return "small";
  if (actorRaca && SMALL_RACES.has(actorRaca)) return "small";
  if (token.monsterEntryId) {
    return resolveMonsterCreatureSize(token.monsterEntryId, token.name, {
      walk: token.walk,
      tier: token.monsterTier,
      variant: token.monsterVariant,
    });
  }
  if (token.monsterTier === "mob" && (token.walk ?? 99) <= 3) return "small";
  return "medium";
}

export function tokenOccupiedHexes(token: BattleToken, actorRaca?: string | null): Axial[] {
  return occupiedHexes(token.axial, creatureSizeOf(token, actorRaca));
}

export function tokenOccupiesAxial(
  token: BattleToken,
  axial: Axial,
  actorRaca?: string | null
): boolean {
  return tokenOccupiedHexes(token, actorRaca).some((h) => h.q === axial.q && h.r === axial.r);
}

export function tokenAxialDistance(
  a: BattleToken,
  b: BattleToken,
  actorRacas?: Record<string, string | undefined>
): number {
  const aRaca = a.actorId ? actorRacas?.[a.actorId] : undefined;
  const bRaca = b.actorId ? actorRacas?.[b.actorId] : undefined;
  const aHexes = tokenOccupiedHexes(a, aRaca);
  const bHexes = tokenOccupiedHexes(b, bRaca);
  let min = Infinity;
  for (const ah of aHexes) {
    for (const bh of bHexes) {
      min = Math.min(min, axialDistance(ah, bh));
    }
  }
  return min === Infinity ? axialDistance(a.axial, b.axial) : min;
}

/** hexSize = centro → vértice; círculo inscrito (centro → aresta) = hexSize × √3/2. */
export const HEX_INSCRIBED_RATIO = Math.sqrt(3) / 2;

/** Legado — raio médio inscrito com folga mínima anti-alias. */
export const TOKEN_RADIUS_RATIO = HEX_INSCRIBED_RATIO - 0.01;

/** Multi-hex: raio visual em múltiplos de hexSize (pequeno/médio usam inscrito). */
export const TOKEN_RADIUS_RATIO_BY_SIZE: Record<CreatureSize, number> = {
  small: HEX_INSCRIBED_RATIO,
  medium: HEX_INSCRIBED_RATIO,
  large: 0.95,
  huge: 1.55,
  gargantuan: 2.52,
  colossal: 3.48,
};

export function hexInscribedRadius(hexSize: number): number {
  return hexSize * HEX_INSCRIBED_RATIO;
}

/** Raio máximo do token — círculo inscrito no hex (centro → aresta), sem ultrapassar. */
export function tokenDrawRadius(hexSize: number, size: CreatureSize): number {
  const edgePad = Math.max(0.5, hexSize * 0.004);
  if (size === "small" || size === "medium") {
    return hexInscribedRadius(hexSize) - edgePad;
  }
  return hexSize * TOKEN_RADIUS_RATIO_BY_SIZE[size];
}

export function tokenPixelCenter(
  anchor: Axial,
  size: CreatureSize,
  hexSize: number,
  ox: number,
  oy: number
): { x: number; y: number } {
  const hexes = occupiedHexes(anchor, size);
  let sx = 0;
  let sy = 0;
  for (const h of hexes) {
    const p = axialToPixel(h.q, h.r, hexSize, ox, oy);
    sx += p.x;
    sy += p.y;
  }
  const n = hexes.length;
  return { x: sx / n, y: sy / n };
}
