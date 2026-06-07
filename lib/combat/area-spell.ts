import type { Axial } from "@/lib/vtt/hex-math";
import { axialDistance } from "@/lib/vtt/hex-math";
import {
  areaNeedsDirection,
  computeAreaHexes,
  type AreaShape,
} from "@/lib/vtt/hex-area";
import { tokenOccupiedHexes } from "@/lib/vtt/creature-size";
import { axialKey } from "@/lib/vtt/token-occupancy";
import type { BattleToken } from "@/lib/vtt/types";
import type { CharacterSheet } from "@/lib/character/types";
import type { CombatActionOption, CombatTurnOptions } from "@/lib/combat/types";
import {
  canAttackTarget,
  isHealingSpell,
  resolveAttack,
  type AttackResolution,
} from "@/lib/combat/attack";
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

export function isAreaSpellAction(action: CombatActionOption): boolean {
  return Boolean(action.areaShape && action.areaShape !== "single");
}

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

function actorRacaOf(
  token: BattleToken,
  actorRacas?: Record<string, string | undefined>
): string | undefined {
  return token.actorId ? actorRacas?.[token.actorId] : undefined;
}

/** Qualquer sobreposição entre footprint do token e hex da área conta como alvo. */
export function tokensInArea(
  tokens: BattleToken[],
  area: Axial[],
  actorRacas?: Record<string, string | undefined>
): BattleToken[] {
  const areaKeys = new Set(area.map(axialKey));
  const seen = new Set<string>();
  const out: BattleToken[] = [];
  for (const t of tokens) {
    if (seen.has(t.id)) continue;
    const hexes = tokenOccupiedHexes(t, actorRacaOf(t, actorRacas));
    if (hexes.some((h) => areaKeys.has(axialKey(h)))) {
      seen.add(t.id);
      out.push(t);
    }
  }
  return out;
}

function isAreaHealAlly(
  caster: BattleToken,
  target: BattleToken
): boolean {
  if (target.id === caster.id) return true;
  const casterMonster = Boolean(caster.monsterEntryId || caster.gmCreationId);
  const targetMonster = Boolean(target.monsterEntryId || target.gmCreationId);
  if (casterMonster) return targetMonster;
  return !targetMonster;
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
  channelExtraPa = 0,
  actorRacas?: Record<string, string | undefined>
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

  const isAreaHeal = isHealingSpell(resolved);
  let targets = tokensInArea(allTokens, areaHexes, actorRacas);
  if (isAreaHeal) {
    targets = targets.filter((t) => isAreaHealAlly(caster, t));
  } else {
    targets = targets.filter((t) => t.id !== caster.id);
  }
  const hits: AreaHit[] = [];

  for (const target of targets) {
    if (!isAreaHeal && (target.vida ?? 0) <= 0 && target.vidaMax != null) continue;

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

  const totalEffect = hits.reduce((sum, h) => {
    if (h.kind === "attack") return sum + (h.result.damage?.total ?? 0);
    if (h.kind === "save") return sum + h.result.damage.total;
    return sum;
  }, 0);

  const channelTag = extra > 0 ? ` [canalizado +${extra} PA]` : "";
  const effectLabel = isAreaHeal ? "cura total" : "dano total";
  const summary =
    hits.length === 0
      ? `${actor.name} conjura ${resolved.name}${channelTag} — nenhum alvo na área.`
      : `${actor.name} conjura ${resolved.name}${channelTag} (${areaHexes.length} hex) — ${hits.length} alvo(s), ${totalEffect} ${effectLabel}.`;

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

export function formatAreaSpellChatDetail(
  res: AreaSpellResolution,
  damageType = "mágico"
): string {
  const hexLabel = res.areaHexes.map((h) => `q${h.q}r${h.r}`).join(", ");
  const tipo = damageType.trim() || "mágico";
  if (res.hits.length === 0) {
    return `Centro q${res.center.q}r${res.center.r} · ${hexLabel}`;
  }
  const lines = res.hits.map((h) => {
    const target = h.tokenId;
    if (h.kind === "save") {
      const r = h.result;
      return `${target}: teste ${r.save.total} vs CD ${r.save.dc} (${r.save.success ? "ok" : "falhou"}) · ${r.damage.total} ${tipo}`;
    }
    if (h.kind === "attack") {
      const r = h.result;
      const dmg = r.damage?.total ?? 0;
      const tag = r.critical ? " CRÍTICO" : r.hit ? "" : " errou";
      return `${target}: ${r.attack.total} vs CA ${r.defenderAc}${tag} · ${dmg} ${tipo}`;
    }
    return h.summary;
  });
  return [`Área q${res.center.q}r${res.center.r} · ${res.areaHexes.length} hex`, ...lines].join(" · ");
}
