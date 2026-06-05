import type { Axial } from "@/lib/vtt/hex-math";
import { axialDistance } from "@/lib/vtt/hex-math";
import { axialKey } from "@/lib/vtt/token-occupancy";
import type { BattleScene, BattleToken, DungeonObject, DungeonObjectKind } from "@/lib/vtt/types";

export function newDungeonObjectId(): string {
  return `dng-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function dungeonObjectsOf(scene: Pick<BattleScene, "dungeonObjects">): DungeonObject[] {
  return scene.dungeonObjects ?? [];
}

export function blockedHexSet(scene: Pick<BattleScene, "dungeonObjects">): Set<string> {
  const set = new Set<string>();
  for (const obj of dungeonObjectsOf(scene)) {
    set.add(axialKey({ q: obj.q, r: obj.r }));
  }
  return set;
}

export function isHexBlocked(
  scene: Pick<BattleScene, "dungeonObjects">,
  axial: Axial
): boolean {
  return blockedHexSet(scene).has(axialKey(axial));
}

export function dungeonObjectAt(
  scene: Pick<BattleScene, "dungeonObjects">,
  axial: Axial
): DungeonObject | null {
  const key = axialKey(axial);
  return dungeonObjectsOf(scene).find((o) => axialKey({ q: o.q, r: o.r }) === key) ?? null;
}

export function hexInDungeonGrid(axial: Axial, gridRadius: number): boolean {
  return axialDistance({ q: 0, r: 0 }, axial) <= gridRadius;
}

export function tokenOccupiesAxialSimple(
  tokens: BattleToken[],
  axial: Axial,
  exceptTokenId?: string
): boolean {
  return tokens.some(
    (t) =>
      t.id !== exceptTokenId && t.axial.q === axial.q && t.axial.r === axial.r
  );
}

/** Tokens não podem entrar nem ser posicionados em hexes bloqueados. */
export function canAnchorTokenAt(
  scene: Pick<BattleScene, "dungeonObjects" | "gridRadius" | "tokens">,
  axial: Axial,
  exceptTokenId?: string
): boolean {
  if (!hexInDungeonGrid(axial, scene.gridRadius)) return false;
  if (isHexBlocked(scene, axial)) return false;
  if (tokenOccupiesAxialSimple(scene.tokens, axial, exceptTokenId)) return false;
  return true;
}

export function canPlaceDungeonObjectAt(
  scene: Pick<BattleScene, "dungeonObjects" | "gridRadius" | "tokens">,
  axial: Axial,
  exceptObjectId?: string
): boolean {
  if (!hexInDungeonGrid(axial, scene.gridRadius)) return false;
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
    return { ok: false, error: "Hex inválido, ocupado por token ou já tem objeto" };
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
  visibleHexSet: Set<string>
): DungeonObject[] {
  return dungeonObjectsOf(scene).filter((o) =>
    visibleHexSet.has(axialKey({ q: o.q, r: o.r }))
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
    if (!hexInDungeonGrid(axial, scene.gridRadius)) continue;
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
