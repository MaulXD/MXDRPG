import type { TokenCondition } from "@/lib/combat/conditions";
import { tokenConditions } from "@/lib/combat/conditions";
import {
  formatTimedEffectBadge,
  formatTimedEffectRemaining,
  findTimedEffectForCondition,
  findTimedEffectForField,
  timedEffectsOf,
} from "@/lib/combat/timed-effects";
import { isTokenDefeated } from "@/lib/vtt/token-hp-display";
import type { TokenEffectIconId } from "@/lib/vtt/token-effect-icons";
import { CONDITION_ICON } from "@/lib/vtt/token-effect-icons";
import type { BattleToken } from "@/lib/vtt/types";

export type TokenEffectKind = "condition" | "buff" | "debuff";

export type TokenEffectChip = {
  id: string;
  kind: TokenEffectKind;
  label: string;
  abbr: string;
  icon: TokenEffectIconId;
  title: string;
  color: string;
  bg: string;
  /** Badge curto no ícone — ex. `3R`, `2T`, `→`. */
  remaining?: string;
};

/** Fundo sólido + ícone claro (alto contraste no hex e na UI). */
export const CONDITION_META: Record<
  TokenCondition,
  { label: string; abbr: string; icon: TokenEffectIconId; color: string; bg: string }
> = {
  amedrontado: {
    label: "Amedrontado",
    abbr: "Am",
    icon: "fear",
    bg: "#4a2f6e",
    color: "#f5ecff",
  },
  cego: { label: "Cego", abbr: "Ce", icon: "blind", bg: "#3a4458", color: "#f0f4fc" },
  atordoado: {
    label: "Atordoado",
    abbr: "At",
    icon: "daze",
    bg: "#6b4a12",
    color: "#fff6d8",
  },
  envenenado: {
    label: "Envenenado",
    abbr: "Ev",
    icon: "poison",
    bg: "#1f5c32",
    color: "#d8ffe0",
  },
  prostrado: {
    label: "Prostrado",
    abbr: "Pr",
    icon: "prone",
    bg: "#5c3a1e",
    color: "#ffe8cc",
  },
  restringido: {
    label: "Restringido",
    abbr: "Re",
    icon: "restraint",
    bg: "#6b3228",
    color: "#ffe2d6",
  },
  encantado: {
    label: "Encantado",
    abbr: "En",
    icon: "charm",
    bg: "#5a2868",
    color: "#ffe8ff",
  },
};

const BUFF_CHIP_STYLE = { bg: "#164058", color: "#e8f6ff" };
const DEBUFF_CHIP_STYLE = { bg: "#5c2424", color: "#ffe8e8" };

export const ALL_TOKEN_CONDITIONS: TokenCondition[] = [
  "amedrontado",
  "cego",
  "atordoado",
  "envenenado",
  "prostrado",
  "restringido",
  "encantado",
];

const FIELD_CHIP_ICONS: Partial<Record<keyof BattleToken, TokenEffectIconId>> = {
  defesaBonus: "shield",
  chargeReady: "charge",
  nextAttackBonus: "atk-up",
  allyAttackAdvantage: "inspire",
  rangedAttackAdvantage: "aim",
  reactionShiftReady: "react",
  bonusDamageFormula: "flame",
};

function withRemaining(chip: TokenEffectChip, badge: string | null, detail: string | null): TokenEffectChip {
  if (!badge && !detail) return chip;
  const title = detail ? `${chip.title} · ${detail}` : chip.title;
  return { ...chip, remaining: badge ?? undefined, title };
}

function buffChip(
  id: string,
  label: string,
  abbr: string,
  icon: TokenEffectIconId,
  title: string,
  style?: { bg?: string; color?: string },
  timed?: { badge: string | null; detail: string | null }
): TokenEffectChip {
  const chip: TokenEffectChip = {
    id,
    kind: "buff",
    label,
    abbr,
    icon,
    title,
    color: style?.color ?? BUFF_CHIP_STYLE.color,
    bg: style?.bg ?? BUFF_CHIP_STYLE.bg,
  };
  return timed ? withRemaining(chip, timed.badge, timed.detail) : chip;
}

function debuffChip(
  id: string,
  label: string,
  abbr: string,
  icon: TokenEffectIconId,
  title: string,
  timed?: { badge: string | null; detail: string | null }
): TokenEffectChip {
  const chip: TokenEffectChip = {
    id,
    kind: "debuff",
    label,
    abbr,
    icon,
    title,
    color: DEBUFF_CHIP_STYLE.color,
    bg: DEBUFF_CHIP_STYLE.bg,
  };
  return timed ? withRemaining(chip, timed.badge, timed.detail) : chip;
}

function timedMeta(fx: ReturnType<typeof timedEffectsOf>[number] | undefined) {
  if (!fx) return { badge: null, detail: null };
  return {
    badge: formatTimedEffectBadge(fx),
    detail: formatTimedEffectRemaining(fx),
  };
}

/** Condições + buffs temporários do token (Cap. 3.4 + habilidades da mesa). */
export function listTokenEffectChips(token: BattleToken): TokenEffectChip[] {
  const out: TokenEffectChip[] = [];
  const coveredFxIds = new Set<string>();

  if (isTokenDefeated(token)) {
    out.push(
      debuffChip("morto", "Morto", "Mt", "skull", "Derrotado — fora de combate")
    );
  }

  for (const c of tokenConditions(token)) {
    const meta = CONDITION_META[c];
    if (!meta) continue;
    const fx = findTimedEffectForCondition(token, c);
    if (fx) coveredFxIds.add(fx.id);
    const timed = timedMeta(fx);
    out.push({
      id: `cond-${c}`,
      kind: fx?.kind === "buff" ? "buff" : "condition",
      label: meta.label,
      abbr: meta.abbr,
      icon: CONDITION_ICON[c] ?? meta.icon,
      title: timed.detail ? `${meta.label} · ${timed.detail}` : meta.label,
      color: meta.color,
      bg: meta.bg,
      remaining: timed.badge ?? undefined,
    });
  }

  if (token.defesaBonus && token.defesaBonus > 0) {
    const fx = findTimedEffectForField(token, "defesaBonus");
    if (fx) coveredFxIds.add(fx.id);
    const src = token.defesaBuffSource ?? "Postura";
    const timed = timedMeta(fx);
    out.push(
      buffChip(
        "def-buff",
        `+${token.defesaBonus} defesa`,
        `+${token.defesaBonus}`,
        "shield",
        timed.detail
          ? `${src}: +${token.defesaBonus} defesa · ${timed.detail}`
          : `${src}: +${token.defesaBonus} defesa`,
        undefined,
        timed
      )
    );
  }

  if (token.chargeReady) {
    const fx = findTimedEffectForField(token, "chargeReady");
    if (fx) coveredFxIds.add(fx.id);
    out.push(
      buffChip(
        "charge",
        "Investida",
        "Inv",
        "charge",
        "Investida pronta — próximo ataque corpo a corpo",
        { bg: "#5c4818", color: "#fff8e0" },
        timedMeta(fx)
      )
    );
  }

  if (token.chargeNote?.trim()) {
    const fx = findTimedEffectForField(token, "chargeNote");
    if (fx) coveredFxIds.add(fx.id);
    out.push(
      buffChip(
        "charge-note",
        token.chargeNote.trim(),
        "Mv",
        "move",
        token.chargeNote.trim(),
        undefined,
        timedMeta(fx)
      )
    );
  }

  if (token.nextAttackBonus && token.nextAttackBonus > 0) {
    const fx = findTimedEffectForField(token, "nextAttackBonus");
    if (fx) coveredFxIds.add(fx.id);
    out.push(
      buffChip(
        "next-atk",
        `+${token.nextAttackBonus} ataque`,
        `+${token.nextAttackBonus}`,
        "atk-up",
        `Próximo ataque +${token.nextAttackBonus}`,
        { bg: "#5c4a14", color: "#fff4d0" },
        timedMeta(fx)
      )
    );
  }

  if (token.allyAttackAdvantage) {
    const fx = findTimedEffectForField(token, "allyAttackAdvantage");
    if (fx) coveredFxIds.add(fx.id);
    out.push(
      buffChip(
        "ally-adv",
        "Inspiração",
        "In",
        "inspire",
        "Próximo ataque com vantagem (aliado)",
        { bg: "#2a5218", color: "#e8ffd0" },
        timedMeta(fx)
      )
    );
  }

  if (token.rangedAttackAdvantage) {
    const fx = findTimedEffectForField(token, "rangedAttackAdvantage");
    if (fx) coveredFxIds.add(fx.id);
    out.push(
      buffChip(
        "ranged-adv",
        "Tiro certeiro",
        "Tc",
        "aim",
        "Próximo ataque à distância com vantagem",
        { bg: "#3a2868", color: "#f0e8ff" },
        timedMeta(fx)
      )
    );
  }

  if (token.reactionShiftReady) {
    const fx = findTimedEffectForField(token, "reactionShiftReady");
    if (fx) coveredFxIds.add(fx.id);
    out.push(
      buffChip("react", "Reflexos", "Rf", "react", "Pode deslocar 1 hex como reação", undefined, timedMeta(fx))
    );
  }

  if (token.bonusDamageFormula?.trim()) {
    const fx = findTimedEffectForField(token, "bonusDamageFormula");
    if (fx) coveredFxIds.add(fx.id);
    out.push(
      buffChip(
        "bonus-dmg",
        token.bonusDamageFormula.trim(),
        "Cn",
        "flame",
        `Dano extra: ${token.bonusDamageFormula.trim()}`,
        { bg: "#6b3010", color: "#ffe8d0" },
        timedMeta(fx)
      )
    );
  }

  const mark = token.attackMark;
  if (mark) {
    if (mark.attackerDisadvantage) {
      out.push(debuffChip("finta", "Finta", "Fn", "feint", "Atacante com desvantagem (finta)"));
    } else {
      const parts: string[] = ["Marca"];
      if (mark.bonus) parts.push(`+${mark.bonus}`);
      if (mark.advantage) parts.push("vantagem");
      if (mark.rangedOnly) parts.push("à distância");
      out.push(
        buffChip("mark", parts.join(" "), "Mk", "mark", parts.join(" · "), {
          bg: "#4a4020",
          color: "#fff6d8",
        })
      );
    }
  }

  for (const fx of timedEffectsOf(token)) {
    if (coveredFxIds.has(fx.id)) continue;
    const label = typeof fx.label === "string" && fx.label.trim() ? fx.label.trim() : "Efeito";
    const icon =
      (fx.condition ? CONDITION_ICON[fx.condition] : undefined) ??
      (fx.clearFields?.[0] ? FIELD_CHIP_ICONS[fx.clearFields[0]] : undefined) ??
      (fx.kind === "buff" ? "shield" : "feint");
    const timed = timedMeta(fx);
    const kind: TokenEffectKind =
      fx.kind === "buff" ? "buff" : fx.kind === "debuff" ? "debuff" : "condition";
    const style =
      kind === "buff"
        ? BUFF_CHIP_STYLE
        : kind === "debuff"
          ? DEBUFF_CHIP_STYLE
          : { bg: "#3a3a48", color: "#f0f0f8" };
    out.push({
      id: `fx-${fx.id}`,
      kind,
      label,
      abbr: label.slice(0, 2),
      icon,
      title: timed.detail ? `${label} · ${timed.detail}` : label,
      color: style.color,
      bg: style.bg,
      remaining: timed.badge ?? undefined,
    });
  }

  return out;
}

export function hasTokenEffects(token: BattleToken): boolean {
  return listTokenEffectChips(token).length > 0;
}
