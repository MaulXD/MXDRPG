import type { TokenCondition } from "@/lib/combat/conditions";
import { tokenConditions } from "@/lib/combat/conditions";
import { TOKEN_FIELD_BUFF_DURATIONS } from "@/lib/combat/buff-durations";
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

/** Tooltip: nome, descrição do efeito e duração restante (se houver). */
export function formatEffectTooltip(
  chip: Pick<TokenEffectChip, "label" | "description" | "durationLabel">
): string {
  const base = `${chip.label}: ${chip.description}`;
  if (chip.durationLabel) return `${base} · Duração: ${chip.durationLabel}`;
  return base;
}

export type TokenEffectKind = "condition" | "buff" | "debuff";

export type TokenEffectChip = {
  id: string;
  kind: TokenEffectKind;
  label: string;
  abbr: string;
  icon: TokenEffectIconId;
  /** Regra do efeito (Cap. 3.4 ou habilidade da mesa). */
  description: string;
  color: string;
  bg: string;
  /** Badge curto no ícone — ex. `3R`, `2T`, `→`. */
  remaining?: string;
  /** Texto de duração restante — ex. `2 turnos`. */
  durationLabel?: string | null;
  /** Tooltip completo (descrição + duração). */
  title: string;
};

export type ConditionMeta = {
  label: string;
  abbr: string;
  icon: TokenEffectIconId;
  color: string;
  bg: string;
  description: string;
};

/** Fundo sólido + ícone claro (alto contraste no célula e na UI). */
export const CONDITION_META: Record<TokenCondition, ConditionMeta> = {
  amedrontado: {
    label: "Amedrontado",
    abbr: "Am",
    icon: "fear",
    bg: "#4a2f6e",
    color: "#f5ecff",
    description:
      "Desvantagem em ataques e testes enquanto a fonte do medo estiver visível.",
  },
  cego: {
    label: "Cego",
    abbr: "Ce",
    icon: "blind",
    bg: "#3a4458",
    color: "#f0f4fc",
    description: "Desvantagem em ataques. Ataques contra têm vantagem.",
  },
  atordoado: {
    label: "Atordoado",
    abbr: "At",
    icon: "daze",
    bg: "#6b4a12",
    color: "#fff6d8",
    description:
      "Incapaz de agir. Falha automática em Força e Destreza. Ataques contra têm vantagem.",
  },
  inconsciente: {
    label: "Inconsciente",
    abbr: "In",
    icon: "daze",
    bg: "#2a3040",
    color: "#e8ecf4",
    description: "0 HP — incapaz de agir. Sem cura, morte em 10 rodadas de combate.",
  },
  envenenado: {
    label: "Envenenado",
    abbr: "Ev",
    icon: "poison",
    bg: "#1f5c32",
    color: "#d8ffe0",
    description: "Desvantagem em ataques e testes de atributo.",
  },
  prostrado: {
    label: "Prostrado",
    abbr: "Pr",
    icon: "prone",
    bg: "#5c3a1e",
    color: "#ffe8cc",
    description: "Velocidade 0 exceto arrastando. Desvantagem em ataques. Ataques contra têm vantagem.",
  },
  restringido: {
    label: "Restringido",
    abbr: "Re",
    icon: "restraint",
    bg: "#6b3228",
    color: "#ffe2d6",
    description:
      "Velocidade 0. Desvantagem em ataques e Destreza. Ataques contra têm vantagem.",
  },
  encantado: {
    label: "Encantado",
    abbr: "En",
    icon: "charm",
    bg: "#5a2868",
    color: "#ffe8ff",
    description:
      "Não pode atacar o encantador. Encantador tem vantagem em interações sociais.",
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

type ChipDraft = Omit<TokenEffectChip, "title" | "durationLabel"> & {
  durationLabel?: string | null;
};

function finalizeChip(
  draft: ChipDraft,
  timed?: { badge: string | null; detail: string | null }
): TokenEffectChip {
  const durationLabel = timed?.detail ?? draft.durationLabel ?? null;
  const chip: TokenEffectChip = {
    ...draft,
    durationLabel,
    remaining: timed?.badge ?? draft.remaining,
    title: "",
  };
  chip.title = formatEffectTooltip(chip);
  return chip;
}

function buffChip(
  id: string,
  label: string,
  abbr: string,
  icon: TokenEffectIconId,
  description: string,
  style?: { bg?: string; color?: string },
  timed?: { badge: string | null; detail: string | null }
): TokenEffectChip {
  return finalizeChip(
    {
      id,
      kind: "buff",
      label,
      abbr,
      icon,
      description,
      color: style?.color ?? BUFF_CHIP_STYLE.color,
      bg: style?.bg ?? BUFF_CHIP_STYLE.bg,
    },
    timed
  );
}

function debuffChip(
  id: string,
  label: string,
  abbr: string,
  icon: TokenEffectIconId,
  description: string,
  timed?: { badge: string | null; detail: string | null }
): TokenEffectChip {
  return finalizeChip(
    {
      id,
      kind: "debuff",
      label,
      abbr,
      icon,
      description,
      color: DEBUFF_CHIP_STYLE.color,
      bg: DEBUFF_CHIP_STYLE.bg,
    },
    timed
  );
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
      debuffChip(
        "morto",
        "Morto",
        "Mt",
        "skull",
        "Derrotado — fora de combate e sem ações na iniciativa."
      )
    );
  }

  for (const c of tokenConditions(token)) {
    const meta = CONDITION_META[c];
    if (!meta) continue;
    const fx = findTimedEffectForCondition(token, c);
    if (fx) coveredFxIds.add(fx.id);
    const timed = timedMeta(fx);
    out.push(
      finalizeChip(
        {
          id: `cond-${c}`,
          kind: fx?.kind === "buff" ? "buff" : "condition",
          label: meta.label,
          abbr: meta.abbr,
          icon: CONDITION_ICON[c] ?? meta.icon,
          description: meta.description,
          color: meta.color,
          bg: meta.bg,
        },
        timed
      )
    );
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
        `${src}: +${token.defesaBonus} na Classe de Armadura. Duração: até próx. turno.`,
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
        "Investida preparada — bônus no próximo ataque corpo a corpo. Duração: 1 turno ou até usar.",
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
        `Movimento especial: ${token.chargeNote.trim()}.`,
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
        `Próximo ataque recebe +${token.nextAttackBonus} no teste de ataque. Duração: ${TOKEN_FIELD_BUFF_DURATIONS.nextAttackBonus?.label ?? "1 turno"}.`,
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
        "Próximo ataque do aliado inspirado rola com vantagem. Duração: 1 turno.",
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
        "Próximo ataque à distância rola com vantagem. Duração: 1 turno.",
        { bg: "#3a2868", color: "#f0e8ff" },
        timedMeta(fx)
      )
    );
  }

  if (token.reactionShiftReady) {
    const fx = findTimedEffectForField(token, "reactionShiftReady");
    if (fx) coveredFxIds.add(fx.id);
    out.push(
      buffChip(
        "react",
        "Reflexos",
        "Rf",
        "react",
        "Pode deslocar 1 célula como reação sem gastar PA. Duração: 1 turno.",
        undefined,
        timedMeta(fx)
      )
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
        `Próximo golpe causa dano extra (${token.bonusDamageFormula.trim()}). Duração: ${TOKEN_FIELD_BUFF_DURATIONS.bonusDamageFormula?.label ?? "1 turno"}.`,
        { bg: "#6b3010", color: "#ffe8d0" },
        timedMeta(fx)
      )
    );
  }

  const mark = token.attackMark;
  if (mark) {
    const markFx = findTimedEffectForField(token, "attackMark");
    if (markFx) coveredFxIds.add(markFx.id);
    const markTimed = timedMeta(markFx);
    const markDuration = TOKEN_FIELD_BUFF_DURATIONS.attackMark?.label ?? "1 turno";
    if (mark.attackerDisadvantage) {
      out.push(
        debuffChip(
          "finta",
          "Finta",
          "Fn",
          "feint",
          `Próximo ataque sofre desvantagem (Finta). Duração: ${markDuration}.`,
          markTimed
        )
      );
    } else {
      const parts: string[] = [];
      if (mark.bonus) parts.push(`+${mark.bonus} no ataque`);
      if (mark.advantage) parts.push("vantagem no ataque");
      if (mark.rangedOnly) parts.push("só à distância");
      const desc =
        parts.length > 0
          ? `Marca ativa no alvo: ${parts.join(", ")}. Duração: ${markDuration}.`
          : `Marca ativa no alvo designado. Duração: ${markDuration}.`;
      out.push(
        buffChip("mark", "Marca", "Mk", "mark", desc, {
          bg: "#4a4020",
          color: "#fff6d8",
        }, markTimed)
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
    const description =
      fx.condition && CONDITION_META[fx.condition]
        ? CONDITION_META[fx.condition].description
        : `Efeito temporário da mesa (${kind === "buff" ? "buff" : kind === "debuff" ? "debuff" : "condição"}).`;
    out.push(
      finalizeChip(
        {
          id: `fx-${fx.id}`,
          kind,
          label,
          abbr: label.slice(0, 2),
          icon,
          description,
          color: style.color,
          bg: style.bg,
        },
        timed
      )
    );
  }

  return out;
}

export function hasTokenEffects(token: BattleToken): boolean {
  return listTokenEffectChips(token).length > 0;
}
