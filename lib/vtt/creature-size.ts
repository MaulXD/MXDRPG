import type { Axial } from "@/lib/vtt/grid-math";
import {
  axialDistance,
  axialToPixel,
} from "@/lib/vtt/grid-math";
import type { BattleToken } from "@/lib/vtt/types";
import { resolveMonsterCreatureSize } from "@/lib/vtt/monster-sizes";
import type { MonsterSpawnVariant } from "@/lib/vtt/monster-scaling";

/** Tamanho corporal no grid (Livro do Jogador — VTT). */
export type CreatureSize =
  | "small"
  | "medium"
  | "large"
  | "huge"
  | "gargantuan"
  | "colossal";

const SMALL_RACES = new Set(["Pequenino", "Gnomo", "Pequenino"]);

/** Células ocupadas por tamanho — tabela tática Eldarin (1 célula ≈ 1,5 m). */
export const SIZE_CELL_COUNT: Record<CreatureSize, number> = {
  small: 1,
  medium: 1,
  large: 4,
  huge: 9,
  gargantuan: 16,
  colossal: 25,
};

/** Rótulo de footprint no grid quadrado. */
export const CREATURE_SIZE_GRID_LABEL: Record<CreatureSize, string> = {
  small: "1×1",
  medium: "1×1",
  large: "2×2",
  huge: "3×3",
  gargantuan: "4×4",
  colossal: "5×5",
};

const SIZE_ORDER: CreatureSize[] = [
  "small",
  "medium",
  "large",
  "huge",
  "gargantuan",
  "colossal",
];

function squareFootprint(anchor: Axial, side: number): Axial[] {
  const cells: Axial[] = [];
  for (let dq = 0; dq < side; dq++) {
    for (let dr = 0; dr < side; dr++) {
      cells.push({ q: anchor.q + dq, r: anchor.r + dr });
    }
  }
  return cells;
}

function footprintSide(size: CreatureSize): number {
  switch (size) {
    case "small":
    case "medium":
      return 1;
    case "large":
      return 2;
    case "huge":
      return 3;
    case "gargantuan":
      return 4;
    case "colossal":
      return 5;
    default:
      return 1;
  }
}

/** Raio visual que preenche o footprint multi-célula (centroide + alcance). */
function footprintFillRadius(cellSize: number, cells: Axial[]): number {
  if (cells.length <= 1) return cellInscribedRadius(cellSize);

  let sx = 0;
  let sy = 0;
  for (const h of cells) {
    const p = axialToPixel(h.q, h.r, cellSize, 0, 0);
    sx += p.x;
    sy += p.y;
  }
  const cx = sx / cells.length;
  const cy = sy / cells.length;

  let maxCenterDist = 0;
  for (const h of cells) {
    const p = axialToPixel(h.q, h.r, cellSize, 0, 0);
    maxCenterDist = Math.max(maxCenterDist, Math.hypot(p.x - cx, p.y - cy));
  }

  return maxCenterDist + cellInscribedRadius(cellSize) * 0.92;
}

export function occupiedCells(anchor: Axial, size: CreatureSize): Axial[] {
  const side = footprintSide(size);
  if (side === 1) return [{ q: anchor.q, r: anchor.r }];
  return squareFootprint(anchor, side);
}

/** Centro geométrico do footprint (células = índices + ½). */
export function footprintCenter(anchor: Axial, size: CreatureSize): { q: number; r: number } {
  const side = footprintSide(size);
  return { q: anchor.q + side / 2, r: anchor.r + side / 2 };
}

/** Âncoras NW possíveis quando o jogador clica numa célula do footprint desejado. */
export function anchorCandidatesForCell(cell: Axial, size: CreatureSize): Axial[] {
  const side = footprintSide(size);
  if (side === 1) return [{ q: cell.q, r: cell.r }];
  const anchors: Axial[] = [];
  for (let dq = 0; dq < side; dq++) {
    for (let dr = 0; dr < side; dr++) {
      anchors.push({ q: cell.q - dq, r: cell.r - dr });
    }
  }
  return anchors;
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
  if (token.sharedCell) return "small";
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

export function tokenOccupiedCells(token: BattleToken, actorRaca?: string | null): Axial[] {
  return occupiedCells(token.axial, creatureSizeOf(token, actorRaca));
}

export function tokenOccupiesAxial(
  token: BattleToken,
  axial: Axial,
  actorRaca?: string | null
): boolean {
  return tokenOccupiedCells(token, actorRaca).some((h) => h.q === axial.q && h.r === axial.r);
}

export function tokenAxialDistance(
  a: BattleToken,
  b: BattleToken,
  actorRacas?: Record<string, string | undefined>
): number {
  const aRaca = a.actorId ? actorRacas?.[a.actorId] : undefined;
  const bRaca = b.actorId ? actorRacas?.[b.actorId] : undefined;
  const aCells = tokenOccupiedCells(a, aRaca);
  const bCells = tokenOccupiedCells(b, bRaca);
  let min = Infinity;
  for (const ah of aCells) {
    for (const bh of bCells) {
      min = Math.min(min, axialDistance(ah, bh));
    }
  }
  return min === Infinity ? axialDistance(a.axial, b.axial) : min;
}

/** cellSize = lado da célula; círculo inscrito ≈ metade do quadrado. */
export const CELL_INSCRIBED_RATIO = 0.48;

/** Legado — raio médio inscrito com folga mínima anti-alias. */
export const TOKEN_RADIUS_RATIO = CELL_INSCRIBED_RATIO - 0.01;

export function cellInscribedRadius(cellSize: number): number {
  return cellSize * CELL_INSCRIBED_RATIO;
}

/** Raio de desenho do token — inscrito no célula (pequeno/médio) ou preenchendo o footprint. */
export function tokenDrawRadius(cellSize: number, size: CreatureSize): number {
  const hs = Number.isFinite(cellSize) && cellSize > 0 ? cellSize : 36;
  const edgePad = Math.max(0.5, hs * 0.004);
  if (size === "small" || size === "medium") {
    return cellInscribedRadius(hs) - edgePad;
  }
  const cells = occupiedCells({ q: 0, r: 0 }, size);
  return Math.max(4, footprintFillRadius(hs, cells)) - edgePad;
}

export function isMultiCellCreatureSize(size: CreatureSize): boolean {
  return size !== "small" && size !== "medium";
}

/**
 * Raio de clique/hover — disco do retrato, não o footprint inteiro.
 * Evita inimigos grandes “roubarem” cliques nos células vizinhos.
 */
export function tokenHitRadius(cellSize: number, size: CreatureSize): number {
  const inscribed = cellInscribedRadius(cellSize);
  const pad = Math.max(2, cellSize * 0.045);
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
  cellSize: number,
  ox: number,
  oy: number
): { x: number; y: number } {
  const cells = occupiedCells(anchor, size);
  let sx = 0;
  let sy = 0;
  for (const h of cells) {
    const p = axialToPixel(h.q, h.r, cellSize, ox, oy);
    sx += p.x;
    sy += p.y;
  }
  const n = cells.length;
  return { x: sx / n, y: sy / n };
}
