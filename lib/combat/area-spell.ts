import type { Axial } from "@/lib/vtt/hex-math";
import { axialDistance } from "@/lib/vtt/hex-math";
import {
  areaNeedsDirection,
  computeAreaHexes,
  type AreaShape,
} from "@/lib/vtt/hex-area";
import { tokenOccupiesAxial } from "@/lib/vtt/creature-size";
import type { BattleToken } from "@/lib/vtt/types";
import type { CharacterSheet } from "@/lib/character/types";
import type { CombatActionOption, CombatTurnOptions } from "@/lib/combat/types";
import { canAttackTarget, resolveAttack, type AttackResolution } from "@/lib/combat/attack";
import {
  actionWithChannel,
  clampChannelExtraPa,
  totalChannelPaCost,
} from "@/lib/combat/spell-channel";
import { checkCanSpendPa } from "@/lib/combat/pa-turn";
import { rechargeBlockReason } from "@/lib/combat/recharge";
import { resolveSaveSpell, type SaveSpellResolution } from "@/lib/combat/spell";

export type SpellAreaShape = AreaShape;

export { areaNeedsDirection };

export function parseAreaShape(raw: string | undefined): SpellAreaShape {
  if (
    raw === "burst" ||
    raw === "wall" ||
    raw === "cone" ||
    raw === "line" ||
    raw === "cube"
  ) {
    return raw;
  }
  return "single";
}

export function computeSpellAreaHexes(
  center: Axial,
  shape: SpellAreaShape,
  radiusHex: number,
  hexCount?: number,
  direction?: number | null,
  lengthHex?: number
): Axial[] {
  return computeAreaHexes({
    center,
    shape,
    radiusHex,
    hexCount,
    lengthHex: lengthHex ?? radiusHex,
    direction,
  });
}

export function tokensInArea(tokens: BattleToken[], area: Axial[]): BattleToken[] {
  return tokens.filter((t) => area.some((hex) => tokenOccupiesAxial(t, hex)));
}

export function canCastAreaAt(
  caster: BattleToken,
  center: Axial,
  action: CombatActionOption,
  turn?: CombatTurnOptions,
  actor?: CharacterSheet | null,
  channelExtraPa = 0
): { ok: boolean; reason?: string } {
  if (action.areaShape === "single" || !action.areaShape) {
    return { ok: false, reason: "Magia não é de área" };
  }
  if (turn?.activeTokenId && caster.id !== turn.activeTokenId && !turn.bypassTurn) {
    return { ok: false, reason: "Aguarde seu turno na iniciativa" };
  }
  const rechargeReason = rechargeBlockReason(caster, action, turn?.combatRound ?? 1);
  if (rechargeReason) return { ok: false, reason: rechargeReason };

  const shape = action.areaShape ?? "burst";
  const directed = areaNeedsDirection(shape);
  const origin = directed ? caster.axial : center;

  const extra = clampChannelExtraPa(action, channelExtraPa);
  const paNeed = actor ? totalChannelPaCost(actor, action, extra) : action.paCost + extra;
  const paCheck = checkCanSpendPa(caster, paNeed);
  if (!paCheck.ok) return { ok: false, reason: paCheck.reason };

  if (!directed) {
    const dist = axialDistance(caster.axial, center);
    if (dist > action.rangeHex) {
      return { ok: false, reason: `Centro fora de alcance (${dist}/${action.rangeHex} hex)` };
    }
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
  turn?: CombatTurnOptions,
  areaDirection?: number | null,
  channelExtraPa = 0
): AreaSpellResolution {
  const extra = clampChannelExtraPa(action, channelExtraPa);
  const resolved = actionWithChannel(action, extra);
  const check = canCastAreaAt(caster, center, action, turn, actor, extra);
  if (!check.ok) throw new Error(check.reason ?? "Área inválida");

  const shape = resolved.areaShape ?? "burst";
  const directed = areaNeedsDirection(shape);
  const areaOrigin = directed ? caster.axial : center;

  if (directed && areaDirection == null) {
    throw new Error("Escolha a direção da área (hex vizinho ao conjurador)");
  }
  const areaHexes = computeSpellAreaHexes(
    areaOrigin,
    shape,
    resolved.areaRadiusHex ?? 1,
    resolved.areaHexCount,
    areaDirection ?? null,
    resolved.areaRadiusHex ?? 1
  );

  if (shape === "wall" && resolved.resolution !== "attack" && !resolved.damageFormula) {
    return {
      casterTokenId: caster.id,
      center,
      areaHexes,
      actionName: resolved.name,
      paCost: totalChannelPaCost(actor, action, extra),
      hits: [],
      summary: `${actor.name} conjura ${resolved.name} em ${areaHexes.length} hex (${areaHexes.map((h) => `q${h.q}r${h.r}`).join(", ")}).`,
    };
  }

  const targets = tokensInArea(allTokens, areaHexes).filter((t) => t.id !== caster.id);
  const hits: AreaHit[] = [];

  for (const target of targets) {
    if ((target.vida ?? 0) <= 0 && target.vidaMax != null) continue;

    if (resolved.resolution === "save") {
      const defenderActor = target.linked && target.actorId ? actors[target.actorId] ?? null : null;
      const res = resolveSaveSpell(caster, target, actor, defenderActor, action, turn, {
        skipRangeCheck: true,
        channelExtraPa: extra,
        skipPaCheck: true,
      });
      hits.push({ tokenId: target.id, kind: "save", result: res });
    } else {
      const res = resolveAttack(caster, target, actor, resolved, turn, undefined, allTokens, {
        skipRangeCheck: true,
        skipPaCheck: true,
      });
      hits.push({ tokenId: target.id, kind: "attack", result: res });
    }
  }

  const totalDmg = hits.reduce((sum, h) => {
    if (h.kind === "attack") return sum + (h.result.damage?.total ?? 0);
    if (h.kind === "save") return sum + h.result.damage.total;
    return sum;
  }, 0);

  const channelTag = extra > 0 ? ` [canalizado +${extra} PA]` : "";
  const summary =
    hits.length === 0
      ? `${actor.name} conjura ${resolved.name}${channelTag} — nenhum alvo na área.`
      : `${actor.name} conjura ${resolved.name}${channelTag} (${areaHexes.length} hex) — ${hits.length} alvo(s), ${totalDmg} dano total.`;

  return {
    casterTokenId: caster.id,
    center: areaOrigin,
    areaHexes,
    actionName: resolved.name,
    paCost: totalChannelPaCost(actor, action, extra),
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
