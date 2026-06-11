import { getEntry } from "@/lib/compendium/registry";

export type SpecimenAssimilationOption = {
  entryId: string;
  name: string;
  effectLabel: string;
  index: number;
};

type MonsterAction = {
  entryId?: string;
  name?: string;
  label?: string;
};

/** Habilidades de assimilação (assim-NNN-N) do monstro no compêndio. */
export function listSpecimenAssimilations(monsterEntryId: string): SpecimenAssimilationOption[] {
  const entry = getEntry("monstros", monsterEntryId);
  if (!entry) return [];

  const catalogId = String((entry.system as { catalogId?: string }).catalogId ?? "");
  const actions = ((entry.system as { actions?: MonsterAction[] }).actions ?? []).filter((a) =>
    String(a.entryId ?? "").startsWith("assim-")
  );

  return actions.map((a, i) => {
    const entryId = String(a.entryId);
    const match = entryId.match(/assim-(\d+)-(\d+)/);
    const index = match ? Number(match[2]) : i + 1;
    return {
      entryId,
      name: String(a.name ?? `Assimilação ${index}`),
      effectLabel: String(a.label ?? "").replace(/^Assimilacao:\s*/i, ""),
      index,
    };
  });
}

export function monsterCatalogId(monsterEntryId: string): string | null {
  const entry = getEntry("monstros", monsterEntryId);
  const id = (entry?.system as { catalogId?: string } | undefined)?.catalogId;
  return id?.trim() || null;
}

export function monsterThreatLevel(monsterEntryId: string): number {
  const entry = getEntry("monstros", monsterEntryId);
  const ameaca = (entry?.system as { tactical?: { ameaca?: { value?: number } } })?.tactical?.ameaca
    ?.value;
  return Math.max(1, Math.floor(Number(ameaca) || 1));
}
