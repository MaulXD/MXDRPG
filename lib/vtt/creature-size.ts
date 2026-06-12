import type { Axial } from "@/lib/vtt/hex-math";
import {
  HEX_DIRECTIONS,
  axialDistance,
  axialToPixel,
  hexesInRange,
} from "@/lib/vtt/hex-math";
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

/** Hexes ocupados por tamanho (Médio 1 · Grande 4 · Gigante 7 · …). */
export const SIZE_HEX_COUNT: Record<CreatureSize, number> = {
  small: 1,
  medium: 1,
  large: 4,
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

/** Grande: losango compacto de 4 hex (âncora + três vizinhos que fecham o bloco). */
function largeOccupiedHexes(anchor: Axial): Axial[] {
  const e = HEX_DIRECTIONS[0];
  const ne = HEX_DIRECTIONS[1];
  const se = HEX_DIRECTIONS[5];
  return [
    anchor,
    { q: anchor.q + e.q, r: anchor.r + e.r },
    { q: anchor.q + se.q, r: anchor.r + se.r },
    { q: anchor.q + ne.q, r: anchor.r + ne.r },
  ];
}

/** Raio visual que preenche o footprint multi-hex (centroide + alcance aos centros dos hexes). */
function footprintFillRadius(hexSize: number, hexes: Axial[]): number {
  if (hexes.length <= 1) return hexInscribedRadius(hexSize);

  let sx = 0;
  let sy = 0;
  for (const h of hexes) {
    const p = axialToPixel(h.q, h.r, hexSize, 0, 0);
    sx += p.x;
    sy += p.y;
  }
  const cx = sx / hexes.length;
  const cy = sy / hexes.length;

  let maxCenterDist = 0;
  for (const h of hexes) {
    const p = axialToPixel(h.q, h.r, hexSize, 0, 0);
    maxCenterDist = Math.max(maxCenterDist, Math.hypot(p.x - cx, p.y - cy));
  }

  return maxCenterDist + hexInscribedRadius(hexSize) * 0.92;
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

export function hexInscribedRadius(hexSize: number): number {
  return hexSize * HEX_INSCRIBED_RATIO;
}

/** Raio de desenho do token — inscrito no hex (pequeno/médio) ou preenchendo o footprint. */
export function tokenDrawRadius(hexSize: number, size: CreatureSize): number {
  const edgePad = Math.max(0.5, hexSize * 0.004);
  if (size === "small" || size === "medium") {
    return hexInscribedRadius(hexSize) - edgePad;
  }
  const hexes = occupiedHexes({ q: 0, r: 0 }, size);
  return Math.max(4, footprintFillRadius(hexSize, hexes)) - edgePad;
}

export function isMultiHexCreatureSize(size: CreatureSize): boolean {
  return size !== "small" && size !== "medium";
}

/**
 * Raio de clique/hover — disco do retrato, não o footprint inteiro.
 * Evita inimigos grandes “roubarem” cliques nos hexes vizinhos.
 */
export function tokenHitRadius(hexSize: number, size: CreatureSize): number {
  const inscribed = hexInscribedRadius(hexSize);
  const pad = Math.max(2, hexSize * 0.045);
  switch (size) {
    case "small":
      return Math.max(4, inscribed * 0.92 + pad);
    case "medium":
      return inscribed + pad;
    case "large":
      return inscribed * 1.22 + pad;
    case "huge":
      return inscribed * 1.38 + pad;
    case "gargantuan":
      return inscribed * 1.52 + pad;
    case "colossal":
      return inscribed * 1.65 + pad;
    default:
      return inscribed + pad;
  }
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
