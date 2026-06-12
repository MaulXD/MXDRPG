import { resolveSpawnAnchor } from "@/lib/vtt/dungeon-layer";
import { createMonsterTokenFromEntryId } from "@/lib/vtt/monsters";
import type { MonsterSpawnOptions } from "@/lib/vtt/monster-scaling";
import type { Axial } from "@/lib/vtt/hex-math";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";

export type SpawnPlacementResult =
  | { ok: true; anchor: Axial; token: BattleToken }
  | { ok: false; reason: string };

/** Valida célula de drop e devolve âncora NW (multi-célula) antes de chamar a API. */
export function resolveMonsterSpawnPlacement(
  scene: Pick<BattleScene, "dungeonObjects" | "gridRadius" | "tokens">,
  cell: Axial,
  entryId: string,
  options?: MonsterSpawnOptions
): SpawnPlacementResult {
  const token = createMonsterTokenFromEntryId(entryId, cell, options);
  if (!token) {
    return { ok: false, reason: "Monstro não encontrado no compêndio" };
  }
  const anchor = resolveSpawnAnchor(scene, cell, { token });
  if (!anchor) {
    return {
      ok: false,
      reason: "Célula bloqueada, ocupada ou fora do mapa — solte mais ao centro do tabuleiro.",
    };
  }
  const placed =
    anchor.q === token.axial.q && anchor.r === token.axial.r
      ? token
      : { ...token, axial: anchor };
  return { ok: true, anchor, token: placed };
}

export function resolveTokenSpawnPlacement(
  scene: Pick<BattleScene, "dungeonObjects" | "gridRadius" | "tokens">,
  cell: Axial,
  token: BattleToken,
  actorRacas?: Record<string, string | undefined>
): SpawnPlacementResult {
  const anchor = resolveSpawnAnchor(scene, cell, { token, actorRacas });
  if (!anchor) {
    return {
      ok: false,
      reason: "Célula bloqueada, ocupada ou fora do mapa — solte mais ao centro do tabuleiro.",
    };
  }
  const placed =
    anchor.q === token.axial.q && anchor.r === token.axial.r
      ? token
      : { ...token, axial: anchor };
  return { ok: true, anchor, token: placed };
}
