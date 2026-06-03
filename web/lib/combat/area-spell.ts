import type { Axial } from "@/lib/vtt/hex-math";
import { axialDistance, hexNeighbors, hexesInRange } from "@/lib/vtt/hex-math";
import type { BattleToken } from "@/lib/vtt/types";
import type { CharacterSheet } from "@/lib/character/types";
import type { CombatActionOption, CombatTurnOptions } from "@/lib/combat/types";
import { canAttackTarget, resolveAttack, type AttackResolution } from "@/lib/combat/attack";
import { resolveSaveSpell, type SaveSpellResolution } from "@/lib/combat/spell";

export type SpellAreaShape = "single" | "burst" | "wall";

export function parseAreaShape(raw: string | undefined): SpellAreaShape {
  if (raw === "burst" || raw === "wall") return raw;
  return "single";
}

export function computeSpellAreaHexes(
  center: Axial,
  shape: SpellAreaShape,
  radiusHex: number,
  hexCount?: number
): Axial[] {
  if (shape === "burst") {
    return hexesInRange(center, Math.max(1, radiusHex));
  }
  if (shape === "wall") {
    const count = hexCount ?? 3;
    const cells = [center, ...hexNeighbors(center)];
    return cells.slice(0, count);
  }
  return [center];
}

export function tokensInArea(tokens: BattleToken[], area: Axial[]): BattleToken[] {
  const keys = new Set(area.map((a) => `${a.q},${a.r}`));
  return tokens.filter((t) => keys.has(`${t.axial.q},${t.axial.r}`));
}

export function canCastAreaAt(
  caster: BattleToken,
  center: Axial,
  action: CombatActionOption,
  turn?: CombatTurnOptions
): { ok: boolean; reason?: string } {
  if (action.areaShape === "single" || !action.areaShape) {
    return { ok: false, reason: "Magia não é de área" };
  }
  if (turn?.activeTokenId && caster.id !== turn.activeTokenId && !turn.bypassTurn) {
    return { ok: false, reason: "Aguarde seu turno na iniciativa" };
  }
  if (caster.pa < action.paCost) {
    return { ok: false, reason: `PA insuficiente (precisa ${action.paCost})` };
  }
  const dist = axialDistance(caster.axial, center);
  if (dist > action.rangeHex) {
    return { ok: false, reason: `Centro fora de alcance (${dist}/${action.rangeHex} hex)` };
  }
  return { ok: true };
}

export type AreaHit =
  | { tokenId: string; kind: "attack"; result: AttackResolution }
  | { tokenId: string; kind: "save"; result: SaveSpellResolution }
  | { tokenId: string; kind: "wall"; summary: string };

export type AreaSpellResolution = {
  casterTokenId: string;
  center: Axial;
  areaHexes: Axial[];
  actionName: string;
  paCost: number;
  hits: AreaHit[];
  summary: string;
};

export function resolveAreaSpell(
  caster: BattleToken,
  center: Axial,
  actor: CharacterSheet,
  action: CombatActionOption,
  allTokens: BattleToken[],
  actors: Record<string, CharacterSheet>,
  turn?: CombatTurnOptions
): AreaSpellResolution {
  const check = canCastAreaAt(caster, center, action, turn);
  if (!check.ok) throw new Error(check.reason ?? "Área inválida");

  const shape = action.areaShape ?? "burst";
  const areaHexes = computeSpellAreaHexes(
    center,
    shape,
    action.areaRadiusHex ?? 1,
    action.areaHexCount
  );

  if (shape === "wall" && action.resolution !== "attack" && !action.damageFormula) {
    return {
      casterTokenId: caster.id,
      center,
      areaHexes,
      actionName: action.name,
      paCost: action.paCost,
      hits: [],
      summary: `${actor.name} conjura ${action.name} em ${areaHexes.length} hex (${areaHexes.map((h) => `q${h.q}r${h.r}`).join(", ")}).`,
    };
  }

  const targets = tokensInArea(allTokens, areaHexes).filter((t) => t.id !== caster.id);
  const hits: AreaHit[] = [];

  for (const target of targets) {
    if ((target.vida ?? 0) <= 0 && target.vidaMax != null) continue;

    if (action.resolution === "save") {
      const defenderActor = target.linked && target.actorId ? actors[target.actorId] ?? null : null;
      const res = resolveSaveSpell(caster, target, actor, defenderActor, action, turn, {
        skipRangeCheck: true,
      });
      hits.push({ tokenId: target.id, kind: "save", result: res });
    } else {
      const res = resolveAttack(caster, target, actor, action, turn, undefined, allTokens, {
        skipRangeCheck: true,
      });
      hits.push({ tokenId: target.id, kind: "attack", result: res });
    }
  }

  const totalDmg = hits.reduce((sum, h) => {
    if (h.kind === "attack") return sum + (h.result.damage?.total ?? 0);
    if (h.kind === "save") return sum + h.result.damage.total;
    return sum;
  }, 0);

  const summary =
    hits.length === 0
      ? `${actor.name} conjura ${action.name} — nenhum alvo na área.`
      : `${actor.name} conjura ${action.name} (${areaHexes.length} hex) — ${hits.length} alvo(s), ${totalDmg} dano total.`;

  return {
    casterTokenId: caster.id,
    center,
    areaHexes,
    actionName: action.name,
    paCost: action.paCost,
    hits,
    summary,
  };
}

export function formatAreaSpellChatDetail(res: AreaSpellResolution): string {
  const hexLabel = res.areaHexes.map((h) => `q${h.q}r${h.r}`).join(", ");
  if (res.hits.length === 0) {
    return `Centro q${res.center.q}r${res.center.r} · ${hexLabel}`;
  }
  const lines = res.hits.map((h) => {
    if (h.kind === "save") {
      return `${h.result.weaponName}→${h.tokenId}: save ${h.result.save.total} vs CD ${h.result.save.dc} · ${h.result.damage.total} dmg`;
    }
    if (h.kind === "attack") {
      return `${h.result.weaponName}→${h.tokenId}: ${h.result.attack.total} vs CA ${h.result.defenderAc} · ${h.result.damage?.total ?? 0} dmg`;
    }
    return h.summary;
  });
  return [`Centro q${res.center.q}r${res.center.r}`, ...lines].join(" · ");
}
