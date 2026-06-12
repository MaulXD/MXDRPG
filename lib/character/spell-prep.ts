import { attributeMod, type ClassId } from "@/lib/character/rules";
import type { CharacterSheet } from "@/lib/character/types";
import { getEntry } from "@/lib/compendium/registry";

export type SpellMeta = {
  level: number;
  school: string;
  name: string;
};

export function spellMeta(entryId: string): SpellMeta {
  const entry = getEntry("magias", entryId);
  const spell = entry?.system.spell as { nivel?: number; escola?: string } | undefined;
  return {
    level: spell?.nivel ?? 1,
    school: spell?.escola?.trim() ?? "",
    name: entry?.name ?? entryId,
  };
}

export function isCantrip(entryId: string): boolean {
  return spellMeta(entryId).level === 0;
}

export function spellLevelLabel(level: number): string {
  if (level === 0) return "Truques";
  return `${level}º círculo`;
}

/** Limite de magias preparadas (não-truques) — Livro Cap. 17.4 simplificado. */
export function maxPreparedSpells(actor: CharacterSheet): number {
  const { classe, nivel } = actor.identity;
  const wis = attributeMod(actor.attributes.sabedoria);
  const int = attributeMod(actor.attributes.inteligencia);
  const cha = attributeMod(actor.attributes.carisma);

  switch (classe as ClassId) {
    case "Clérigo":
    case "Druida":
      return Math.max(1, nivel + wis);
    case "Mago":
    case "Artífice":
      return Math.max(4, nivel + int + 3);
    case "Bardo":
      return Math.max(3, nivel + 2);
    case "Bruxo":
      return Math.max(2, nivel + cha);
    case "Paladino":
      return Math.max(1, Math.floor(nivel / 2) + wis);
    default:
      return 99;
  }
}

export function isCasterClass(classe: string): boolean {
  return ["Mago", "Clérigo", "Druida", "Bardo", "Artífice", "Bruxo", "Paladino"].includes(classe);
}

/** null = sem lista explícita → todas as magias do inventário ficam disponíveis. */
export function explicitPreparedIds(actor: CharacterSheet): string[] | null {
  const ids = actor.preparedSpellIds;
  if (!ids || ids.length === 0) return null;
  return ids;
}

export function isSpellCombatReady(actor: CharacterSheet, entryId: string): boolean {
  const prepared = explicitPreparedIds(actor);
  if (!prepared) return true;
  if (isCantrip(entryId)) return true;
  return prepared.includes(entryId);
}

export function countPreparedLeveled(actor: CharacterSheet): number {
  const ids = actor.preparedSpellIds ?? [];
  return ids.filter((id) => !isCantrip(id)).length;
}

export function togglePreparedSpell(actor: CharacterSheet, entryId: string, on: boolean): string[] {
  const current = new Set(actor.preparedSpellIds ?? []);
  if (on) {
    if (!isCantrip(entryId) && countPreparedLeveled({ ...actor, preparedSpellIds: [...current] }) >= maxPreparedSpells(actor)) {
      throw new Error(`Limite de magias preparadas (${maxPreparedSpells(actor)})`);
    }
    current.add(entryId);
  } else {
    current.delete(entryId);
  }
  return [...current].sort();
}
