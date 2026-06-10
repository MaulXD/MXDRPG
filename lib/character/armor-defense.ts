import { getEntry } from "@/lib/compendium/registry";
import { attributeMod } from "@/lib/character/rules";
import type { CharacterSheet } from "@/lib/character/types";
import type { CompendiumEntry } from "@/lib/compendium/types";

export type ArmorLoadout = {
  packId: "equipamentos";
  entryId: string;
};

type ArmorCat = "leve" | "media" | "pesada" | "organica";

export function parseArmorEntry(
  entry: CompendiumEntry
): { caBase: number; categoria: ArmorCat } | null {
  const armor = entry.system?.armor as { caBase?: number; categoria?: string } | undefined;
  if (!armor?.caBase) return null;
  const categoria = (armor.categoria as ArmorCat) ?? "leve";
  return { caBase: armor.caBase, categoria };
}

export function armorMagicBonus(entry: CompendiumEntry): number {
  const tactical = entry.system?.tactical as { bonusDefesa?: { value?: number } } | undefined;
  const fromTactical = tactical?.bonusDefesa?.value;
  if (typeof fromTactical === "number") return fromTactical;
  const enchant = entry.system?.enchant;
  return typeof enchant === "number" ? enchant : 0;
}

function dexForArmor(categoria: ArmorCat, caBase: number, desMod: number): number {
  if (categoria === "leve") return desMod;
  if (categoria === "media") return Math.min(desMod, 2);
  if (categoria === "pesada") return 0;
  if (caBase >= 17) return 0;
  if (caBase === 13) return desMod;
  if (caBase >= 14) return Math.min(desMod, 2);
  return desMod;
}

export function computeDefesaFromArmor(desMod: number, entry: CompendiumEntry | null): number {
  if (!entry) return 10 + desMod;
  const parsed = parseArmorEntry(entry);
  if (!parsed) return 10 + desMod;
  return (
    parsed.caBase +
    dexForArmor(parsed.categoria, parsed.caBase, desMod) +
    armorMagicBonus(entry)
  );
}

export function resolveActorDefesa(actor: CharacterSheet): number {
  const desMod = attributeMod(actor.attributes.destreza);
  const loadout = actor.armorLoadout;
  if (!loadout?.entryId) {
    return actor.tactical?.defesa ?? 10 + desMod;
  }
  const entry = getEntry("equipamentos", loadout.entryId);
  if (!entry || entry.type !== "equipamento") {
    return actor.tactical?.defesa ?? 10 + desMod;
  }
  return computeDefesaFromArmor(desMod, entry);
}

export function isArmorEntry(entry: CompendiumEntry): boolean {
  return entry.type === "equipamento" && Boolean(parseArmorEntry(entry));
}
