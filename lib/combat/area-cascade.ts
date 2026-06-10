import type { AreaHit } from "@/lib/combat/area-spell";
import type { CombatActionOption } from "@/lib/combat/types";
import { axialDistance } from "@/lib/vtt/hex-math";
import type { Axial } from "@/lib/vtt/hex-math";
import type { BattleToken } from "@/lib/vtt/types";

export type AreaCascadeMode = "distance" | "initiative" | "simultaneous";

/** Define como a animação percorre os alvos da magia de área. */
export function resolveAreaCascadeMode(action: CombatActionOption): AreaCascadeMode {
  const shape = action.areaShape ?? "burst";

  if (shape === "wall") return "simultaneous";

  if (action.resolution === "save") {
    if (shape === "burst" || shape === "cube") return "simultaneous";
    if (shape === "cone" || shape === "line") return "distance";
  }

  if (shape === "cone" || shape === "line") return "distance";
  if (shape === "burst" || shape === "cube") return "distance";

  return "distance";
}

export function sortAreaHits(
  hits: AreaHit[],
  tokens: BattleToken[],
  center: Axial,
  caster: BattleToken,
  mode: AreaCascadeMode,
  combatOrder: string[] = []
): AreaHit[] {
  if (hits.length <= 1 || mode === "simultaneous") return hits;

  const tokenById = new Map(tokens.map((t) => [t.id, t]));

  if (mode === "initiative") {
    return [...hits].sort((a, b) => {
      const ia = combatOrder.indexOf(a.tokenId);
      const ib = combatOrder.indexOf(b.tokenId);
      if (ia < 0 && ib < 0) return 0;
      if (ia < 0) return 1;
      if (ib < 0) return -1;
      return ia - ib;
    });
  }

  const origin = center;
  return [...hits].sort((a, b) => {
    const ta = tokenById.get(a.tokenId);
    const tb = tokenById.get(b.tokenId);
    if (!ta || !tb) return 0;
    const da = axialDistance(origin, ta.axial);
    const db = axialDistance(origin, tb.axial);
    if (da !== db) return da - db;
    const ca = axialDistance(caster.axial, ta.axial);
    const cb = axialDistance(caster.axial, tb.axial);
    return ca - cb;
  });
}

/** Rótulo genérico no resolve visual; tipo completo fica no chat/detalhe. */
export function generalDamagePresetLabel(): string {
  return "Dano";
}
