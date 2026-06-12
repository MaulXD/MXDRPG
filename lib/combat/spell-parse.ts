import type { CompendiumEntry } from "@/lib/compendium/types";
import type { AttributeKey } from "@/lib/character/rules";
import { parseAreaShape, type SpellAreaShape } from "@/lib/combat/area-spell";
import { PA_DEFAULT_ACTION_COST } from "@/lib/combat/pa-economy";
import { resolveSpellPaCost } from "@/lib/combat/pa-balance";
import { parseRecharge } from "@/lib/combat/recharge";
import { parseSpellChannel } from "@/lib/combat/spell-channel";
import { parseSpellTargetCount } from "@/lib/combat/spell-target-count";
import type { CombatActionOption } from "@/lib/combat/types";

const SAVE_ATTR_MAP: Record<string, AttributeKey> = {
  for: "forca",
  forca: "forca",
  des: "destreza",
  destreza: "destreza",
  con: "constituicao",
  constituicao: "constituicao",
  int: "inteligencia",
  inteligencia: "inteligencia",
  sab: "sabedoria",
  sabedoria: "sabedoria",
  car: "carisma",
  carisma: "carisma",
};

export function parseSaveFromText(text: string): AttributeKey | undefined {
  const m = text.match(
    /\b(FOR|DES|CON|INT|SAB|CAR|força|forca|destreza|constituição|constituicao|inteligência|inteligencia|sabedoria|carisma)\b.*?\bCD\b/i
  );
  if (!m) return undefined;
  const raw = m[1]!.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (raw.startsWith("for")) return "forca";
  if (raw.startsWith("des")) return "destreza";
  if (raw.startsWith("con")) return "constituicao";
  if (raw.startsWith("int")) return "inteligencia";
  if (raw.startsWith("sab")) return "sabedoria";
  if (raw.startsWith("car")) return "carisma";
  return undefined;
}

export function parseDamageFromText(text: string): { formula: string; tipo: string } | null {
  const plain = text.replace(/<[^>]+>/g, " ");
  const m = plain.match(
    /(\d+d\d+(?:\s*\+\s*\d+)?)\s*(fogo|gelo|ácido|acido|elétrico|eletrico|necrótico|necrotico|mágico|magico|perfurante|contundente|veneno|psíquico|psiquico|radiante|trevas|força|forca)/i
  );
  if (!m) return null;
  return {
    formula: m[1]!.replace(/\s+/g, ""),
    tipo: m[2]!.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
  };
}

export function parseHealFromText(text: string): string | null {
  const plain = text.replace(/<[^>]+>/g, " ");
  const cura = plain.match(/Cura\s+(\d+d\d+(?:\+\d+)?)/i);
  if (cura) return cura[1]!.replace(/\s+/g, "");
  const recupera = plain.match(/recupera\s+(\d+d\d+(?:\s*\+\s*\d+)?)/i);
  if (recupera) return recupera[1]!.replace(/\s+/g, "");
  const ate = plain.match(/(\d+d\d+)\s*\+\s*mod/i);
  if (ate) return ate[1]!;
  return null;
}

export function parseAreaFromText(text: string): {
  shape: SpellAreaShape;
  radiusHex?: number;
  hexCount?: number;
  lengthHex?: number;
} | null {
  const plain = text.replace(/<[^>]+>/g, " ").toLowerCase();
  if (/cubo\s+(\d+)\s*hex/.test(plain)) {
    const n = Number(plain.match(/cubo\s+(\d+)\s*hex/)?.[1] ?? 1);
    return { shape: "cube", radiusHex: Math.max(1, Math.ceil(n / 2)) };
  }
  if (/raio\s+de\s+(\d+)\s*m/.test(plain) || /em\s+raio/.test(plain)) {
    return { shape: "burst", radiusHex: 2 };
  }
  if (/cone/.test(plain)) return { shape: "cone", lengthHex: 2, radiusHex: 2 };
  if (/linha/.test(plain)) return { shape: "line", lengthHex: 3, radiusHex: 3 };
  if (/parede|muralha|wall/.test(plain)) return { shape: "wall", hexCount: 3 };
  if (/esfera|burst|explos/.test(plain)) return { shape: "burst", radiusHex: 2 };
  return null;
}

export type SpellEffectKind =
  | "utility"
  | "heal"
  | "ac_buff"
  | "stabilize"
  | "cleanse"
  | "revive"
  | "debuff";

export function inferSpellEffect(entry: CompendiumEntry, desc: string): SpellEffectKind {
  const id = entry.id;
  const lower = desc.toLowerCase();
  if (id.includes("curar") || id.includes("cura-em-massa") || lower.includes("cura "))
    return "heal";
  if (id.includes("estabilizar") || lower.includes("0 hp")) return "stabilize";
  if (id.includes("purificar") || id.includes("purificacao")) return "cleanse";
  if (id.includes("ressurreicao") || lower.includes("volta com 1 hp")) return "revive";
  if (id.includes("armadura") || id.includes("escudo") || lower.includes("+") && lower.includes("defesa"))
    return "ac_buff";
  if (entry.system.spell && (entry.system.spell as { save?: unknown }).save) return "debuff";
  return "utility";
}

export function inferSelfTarget(rangeHex: number, desc: string): boolean {
  if (rangeHex <= 0) return true;
  const lower = desc.toLowerCase();
  return (
    lower.includes("em si") ||
    lower.includes("você mesmo") ||
    lower.includes("voce mesmo") ||
    lower.includes("alvo: você") ||
    /\bself\b/.test(lower)
  );
}

export function inferAllyTarget(desc: string, spellEffect: SpellEffectKind): boolean {
  if (spellEffect === "heal" || spellEffect === "stabilize" || spellEffect === "cleanse" || spellEffect === "revive")
    return true;
  const lower = desc.toLowerCase();
  return lower.includes("aliado") || lower.includes("toque") || lower.includes("criatura amig");
}

export function parseSaveAttribute(raw: string | undefined): AttributeKey | undefined {
  if (!raw) return undefined;
  return SAVE_ATTR_MAP[raw.toLowerCase()] ?? undefined;
}

export function spellPlainDescription(entry: CompendiumEntry): string {
  return typeof entry.system.description === "string" ? entry.system.description : "";
}

/** Sempre produz uma ação de combate para qualquer entrada de magia do compêndio. */
export function buildMagiaCombatAction(entry: CompendiumEntry): CombatActionOption {
  const weapon = entry.system.weapon as
    | { dano?: { formula?: string; tipo?: string }; ataque?: { bonus?: number } }
    | undefined;
  const spell = entry.system.spell as
    | {
        nivel?: number;
        save?: { attribute?: string; cd?: number };
        channel?: { maxExtraPa?: number; bonusPerPa?: string };
        recarga?: string;
        area?: {
          shape?: string;
          radiusHex?: number;
          hexCount?: number;
          lengthHex?: number;
        };
        targets?: number;
      }
    | undefined;
  const tactical = entry.system.tactical as
    | { alcanceHex?: { value?: number }; custoPontosAcao?: { value?: number } }
    | undefined;

  const desc = spellPlainDescription(entry);
  const parsedDmg = parseDamageFromText(desc);
  const parsedHeal = parseHealFromText(desc);
  const parsedArea = parseAreaFromText(desc);

  const saveAttr =
    parseSaveAttribute(spell?.save?.attribute) ?? parseSaveFromText(desc);
  const areaShape =
    parseAreaShape(spell?.area?.shape) ??
    (parsedArea ? parsedArea.shape : "single");
  const isAreaSpell = areaShape !== "single";

  const healFormula =
    weapon?.dano?.tipo?.toLowerCase().includes("cura") && weapon?.dano?.formula
      ? weapon.dano.formula
      : parsedHeal;
  const isHealSpell = Boolean(healFormula);

  const damageFormula =
    weapon?.dano?.formula ??
    healFormula ??
    parsedDmg?.formula ??
    (saveAttr ? "0" : "1d4");
  const damageType =
    weapon?.dano?.tipo ??
    (isHealSpell ? "cura" : parsedDmg?.tipo ?? "mágico");

  const isSaveSpell = Boolean(saveAttr) && !isHealSpell;
  const resolution = isSaveSpell ? "save" : "attack";

  const rangeHex = tactical?.alcanceHex?.value ?? 1;
  const rawPa = tactical?.custoPontosAcao?.value ?? PA_DEFAULT_ACTION_COST;
  const paCost = resolveSpellPaCost(entry.id, rawPa);

  const areaSize =
    spell?.area?.lengthHex ??
    spell?.area?.radiusHex ??
    parsedArea?.lengthHex ??
    parsedArea?.radiusHex ??
    (areaShape === "wall" ? undefined : 2);

  const spellEffect = inferSpellEffect(entry, desc);
  const selfTarget = inferSelfTarget(rangeHex, desc) || spellEffect === "ac_buff";
  const allyTarget =
    inferAllyTarget(desc, spellEffect) ||
    (isHealSpell && !isAreaSpell && !selfTarget);

  const defesaBuffAmount =
    spellEffect === "ac_buff"
      ? entry.id.includes("escudo")
        ? 5
        : 2
      : undefined;

  const channel = parseSpellChannel(spell?.channel);
  const recharge = parseRecharge(spell?.recarga);
  const targetCount = parseSpellTargetCount(desc, spell);

  const tags: string[] = [];
  if (isSaveSpell) tags.push("teste");
  if (isHealSpell) tags.push("cura");
  if (isAreaSpell) tags.push(`área ${areaShape}`);
  if (selfTarget) tags.push("self");
  if (allyTarget) tags.push("aliado");
  if (channel) tags.push("canalizável");
  if (targetCount > 1) tags.push(`${targetCount} alvos`);

  const spellLevel = spell?.nivel ?? 1;
  const spellSchool = (spell as { escola?: string } | undefined)?.escola?.trim() ?? "";

  return {
    packId: "magias",
    entryId: entry.id,
    name: entry.name,
    kind: "spell",
    spellLevel,
    spellSchool: spellSchool || undefined,
    resolution,
    damageFormula,
    damageType,
    attackBonus: weapon?.ataque?.bonus ?? 0,
    rangeHex,
    paCost,
    saveAttribute: saveAttr,
    saveDc: spell?.save?.cd,
    areaShape: isAreaSpell ? areaShape : undefined,
    areaRadiusHex:
      areaShape === "burst" ||
      areaShape === "cube" ||
      areaShape === "cone" ||
      areaShape === "line"
        ? (areaSize ?? 2)
        : undefined,
    areaHexCount: areaShape === "wall" ? spell?.area?.hexCount ?? parsedArea?.hexCount ?? 3 : undefined,
    channelMaxExtraPa: channel?.maxExtraPa,
    channelBonusPerPa: channel?.bonusPerPa,
    recharge: recharge ?? undefined,
    selfTarget: selfTarget || undefined,
    allyTarget: allyTarget || undefined,
    spellEffect,
    defesaBuffAmount,
    targetCount: targetCount > 1 ? targetCount : undefined,
    label: `${entry.name} · ${selfTarget ? "self" : allyTarget ? "aliado" : `${rangeHex} células`} · PA ${paCost}${tags.length ? ` · ${tags.join(", ")}` : ""}`,
  };
}
