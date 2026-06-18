import type { Axial } from "@/lib/vtt/grid-math";
import { inSquareGrid } from "@/lib/vtt/grid-math";
import {
  anchorCandidatesForCell,
  creatureSizeOf,
  occupiedCells,
  tokenOccupiesAxial,
  type CreatureSize,
} from "@/lib/vtt/creature-size";
import {
  axialKey,
  buildOccupancy,
  canEnterCell,
} from "@/lib/vtt/token-occupancy";
import type { BattleScene, BattleToken, DungeonObject, DungeonObjectKind } from "@/lib/vtt/types";

export function newDungeonObjectId(): string {
  return `dng-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function dungeonObjectsOf(scene: Pick<BattleScene, "dungeonObjects">): DungeonObject[] {
  return scene.dungeonObjects ?? [];
}

export function blockedCellSet(scene: Pick<BattleScene, "dungeonObjects">): Set<string> {
  const set = new Set<string>();
  for (const obj of dungeonObjectsOf(scene)) {
    set.add(axialKey({ q: obj.q, r: obj.r }));
  }
  return set;
}

export function isCellBlocked(
  scene: Pick<BattleScene, "dungeonObjects">,
  axial: Axial
): boolean {
  return blockedCellSet(scene).has(axialKey(axial));
}

export function dungeonObjectAt(
  scene: Pick<BattleScene, "dungeonObjects">,
  axial: Axial
): DungeonObject | null {
  const key = axialKey(axial);
  return dungeonObjectsOf(scene).find((o) => axialKey({ q: o.q, r: o.r }) === key) ?? null;
}

export function cellInGridBounds(axial: Axial, gridRadius: number): boolean {
  return inSquareGrid(axial, gridRadius);
}

export function tokenOccupiesAxialSimple(
  tokens: BattleToken[],
  axial: Axial,
  exceptTokenId?: string,
  actorRacas: Record<string, string | undefined> = {}
): boolean {
  return tokens.some((t) => {
    if (t.id === exceptTokenId) return false;
    const raca = t.actorId ? actorRacas[t.actorId] : undefined;
    return tokenOccupiesAxial(t, axial, raca);
  });
}

type AnchorTokenOpts = {
  exceptTokenId?: string;
  /** Token sendo posicionado (spawn) — ainda não está em `scene.tokens`. */
  token?: BattleToken;
  moverSize?: CreatureSize;
  actorRacas?: Record<string, string | undefined>;
};

/** Tokens não podem entrar nem ser posicionados em células bloqueados ou ocupados. */
export function canAnchorTokenAt(
  scene: Pick<BattleScene, "dungeonObjects" | "gridRadius" | "tokens">,
  axial: Axial,
  exceptTokenIdOrOpts?: string | AnchorTokenOpts,
  legacyOpts?: AnchorTokenOpts
): boolean {
  const opts: AnchorTokenOpts =
    typeof exceptTokenIdOrOpts === "string"
      ? { exceptTokenId: exceptTokenIdOrOpts, ...legacyOpts }
      : (exceptTokenIdOrOpts ?? {});

  const exceptTokenId = opts.exceptTokenId ?? null;
  const actorRacas = opts.actorRacas ?? {};
  const mover =
    opts.token ??
    (exceptTokenId ? scene.tokens.find((t) => t.id === exceptTokenId) : undefined);
  const moverRaca = mover?.actorId ? actorRacas[mover.actorId] : undefined;
  const moverSize =
    opts.moverSize ?? (mover ? creatureSizeOf(mover, moverRaca) : "medium");

  const sizeOf = (t: BattleToken): CreatureSize => {
    const raca = t.actorId ? actorRacas[t.actorId] : undefined;
    return creatureSizeOf(t, raca);
  };
  const occupancy = buildOccupancy(scene.tokens, exceptTokenId, sizeOf, actorRacas);

  for (const cell of occupiedCells(axial, moverSize)) {
    if (!cellInGridBounds(cell, scene.gridRadius)) return false;
    if (isCellBlocked(scene, cell)) return false;
  }

  return canEnterCell(axial, moverSize, occupancy, scene.gridRadius);
}

/**
 * Célula clicada → âncora NW válida (spawn / reposicionar criaturas multi-célula).
 */
export function resolveSpawnAnchor(
  scene: Pick<BattleScene, "dungeonObjects" | "gridRadius" | "tokens">,
  cell: Axial,
  opts: AnchorTokenOpts
): Axial | null {
  const token = opts.token;
  const moverRaca = token?.actorId ? opts.actorRacas?.[token.actorId] : undefined;
  const size =
    opts.moverSize ?? (token ? creatureSizeOf(token, moverRaca) : "medium");

  if (size === "small" || size === "medium") {
    return canAnchorTokenAt(scene, cell, opts) ? cell : null;
  }

  for (const anchor of anchorCandidatesForCell(cell, size)) {
    if (canAnchorTokenAt(scene, anchor, opts)) return anchor;
  }
  return null;
}

export function canPlaceDungeonObjectAt(
  scene: Pick<BattleScene, "dungeonObjects" | "gridRadius" | "tokens">,
  axial: Axial,
  exceptObjectId?: string
): boolean {
  if (!cellInGridBounds(axial, scene.gridRadius)) return false;
  const existing = dungeonObjectAt(scene, axial);
  if (existing && existing.id !== exceptObjectId) return false;
  if (tokenOccupiesAxialSimple(scene.tokens, axial)) return false;
  return true;
}

export function addDungeonObject(
  scene: Pick<BattleScene, "dungeonObjects" | "gridRadius" | "tokens">,
  kind: DungeonObjectKind,
  axial: Axial
): { ok: true; objects: DungeonObject[] } | { ok: false; error: string } {
  if (!canPlaceDungeonObjectAt(scene, axial)) {
    return { ok: false, error: "Célula inválida, ocupada por token ou já tem objeto" };
  }
  const objects = [...dungeonObjectsOf(scene)];
  const at = dungeonObjectAt(scene, axial);
  if (at) {
    const idx = objects.findIndex((o) => o.id === at.id);
    if (idx >= 0) objects[idx] = { ...at, kind };
    return { ok: true, objects };
  }
  objects.push({ id: newDungeonObjectId(), kind, q: axial.q, r: axial.r });
  return { ok: true, objects };
}

export function removeDungeonObjectAt(
  scene: Pick<BattleScene, "dungeonObjects">,
  axial: Axial
): DungeonObject[] {
  const key = axialKey(axial);
  return dungeonObjectsOf(scene).filter((o) => axialKey({ q: o.q, r: o.r }) !== key);
}

export function moveDungeonObject(
  scene: Pick<BattleScene, "dungeonObjects" | "gridRadius" | "tokens">,
  objectId: string,
  target: Axial
): { ok: true; objects: DungeonObject[] } | { ok: false; error: string } {
  const objects = dungeonObjectsOf(scene);
  const idx = objects.findIndex((o) => o.id === objectId);
  if (idx < 0) return { ok: false, error: "Objeto não encontrado" };
  if (!canPlaceDungeonObjectAt(scene, target, objectId)) {
    return { ok: false, error: "Destino inválido ou ocupado" };
  }
  const next = [...objects];
  next[idx] = { ...next[idx]!, q: target.q, r: target.r };
  return { ok: true, objects: next };
}

export function filterDungeonObjectsForFog(
  scene: Pick<BattleScene, "dungeonObjects">,
  visibleCellSet: Set<string>
): DungeonObject[] {
  return dungeonObjectsOf(scene).filter((o) =>
    visibleCellSet.has(axialKey({ q: o.q, r: o.r }))
  );
}

export function sanitizeDungeonObjects(
  scene: Pick<BattleScene, "dungeonObjects" | "gridRadius" | "tokens">
): DungeonObject[] {
  const seen = new Set<string>();
  const out: DungeonObject[] = [];
  for (const obj of dungeonObjectsOf(scene)) {
    const axial = { q: obj.q, r: obj.r };
    const key = axialKey(axial);
    if (!cellInGridBounds(axial, scene.gridRadius)) continue;
    if (seen.has(key)) continue;
    if (tokenOccupiesAxialSimple(scene.tokens, axial)) continue;
    seen.add(key);
    out.push({
      id: obj.id?.trim() || newDungeonObjectId(),
      kind: obj.kind === "object" ? "object" : "wall",
      q: obj.q,
      r: obj.r,
    });
  }
  return out;
}
