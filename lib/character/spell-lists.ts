import spellListsData from "@/data/character/spell-lists.json";
import type { ClassId } from "@/lib/character/rules";

type SpellListDef = {
  label: string;
  cantrips?: string[];
  levels?: Record<string, string[]>;
};

type ClassAccess = {
  lists: string[];
  mode: "learn" | "known" | "prepare";
  cantripsKnown?: number;
  spellsKnownAtLevel1?: number;
  spellsPerLevel?: number;
  alsoCantripsFrom?: string[];
  halfCaster?: boolean;
};

const data = spellListsData as {
  lists: Record<string, SpellListDef>;
  classAccess: Record<string, ClassAccess>;
  sharedPools: Record<string, { label: string; description?: string; entryIds: string[] }>;
};

export function spellListsForClass(classe: string): SpellListDef[] {
  const access = data.classAccess[classe];
  if (!access) return [];
  return access.lists.map((id) => data.lists[id]).filter(Boolean);
}

export function classSpellAccess(classe: string): ClassAccess | null {
  return data.classAccess[classe] ?? null;
}

export function allSpellEntryIdsForClass(classe: string): Set<string> {
  const access = data.classAccess[classe];
  const out = new Set<string>();
  if (!access) return out;

  for (const listId of access.lists) {
    const list = data.lists[listId];
    if (!list) continue;
    for (const id of list.cantrips ?? []) out.add(id);
    for (const ids of Object.values(list.levels ?? {})) {
      for (const id of ids) out.add(id);
    }
  }
  if (access.alsoCantripsFrom) {
    for (const listId of access.alsoCantripsFrom) {
      const list = data.lists[listId];
      for (const id of list?.cantrips ?? []) out.add(id);
    }
  }
  return out;
}

/** Magias elegíveis para aprender/preparar conforme listas da classe (Cap. 17.7). */
export function isSpellAllowedForClass(classe: string, entryId: string): boolean {
  if (!isCasterClassId(classe)) return false;
  const allowed = allSpellEntryIdsForClass(classe);
  if (allowed.size === 0) return true;
  return allowed.has(entryId);
}

export function isCasterClassId(classe: string): boolean {
  return classe in data.classAccess;
}

export function sharedSpellPools(): typeof data.sharedPools {
  return data.sharedPools;
}

export function maxSpellsKnownForClass(classe: ClassId | string, level: number): number | null {
  const access = data.classAccess[classe];
  if (!access || access.mode === "prepare") return null;
  const base = access.spellsKnownAtLevel1 ?? 0;
  const per = access.spellsPerLevel ?? 0;
  return base + Math.max(0, level - 1) * per;
}
