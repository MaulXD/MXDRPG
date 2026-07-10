import talentosData from "@/data/compendiums/talentos.json";

export type UniversalFeat = {
  id: string;
  name: string;
  category: string;
  levelMin: number;
  prerequisites: string;
  description: string;
};

export const FEAT_CATEGORY_LABELS: Record<string, string> = {
  combate: "Combate",
  culinario: "Culinária",
  sobrevivencia: "Sobrevivência",
  social: "Social",
};

const ALL_FEATS: UniversalFeat[] = (
  talentosData as Array<{
    id: string;
    name: string;
    system: {
      category: string;
      levelMin: number;
      prerequisites: string;
      description: string;
    };
  }>
).map((e) => ({
  id: e.id,
  name: e.name,
  category: e.system.category ?? "",
  levelMin: e.system.levelMin ?? 4,
  prerequisites: e.system.prerequisites ?? "",
  description: e.system.description ?? "",
}));

export function listAllFeats(): UniversalFeat[] {
  return ALL_FEATS;
}

/** Available feats for a level-up: levelMin satisfied + not already owned. */
export function listFeatsForLevel(level: number, ownedIds: string[] = []): UniversalFeat[] {
  const owned = new Set(ownedIds);
  return ALL_FEATS.filter((f) => f.levelMin <= level && !owned.has(f.id));
}

export function getFeat(id: string): UniversalFeat | undefined {
  return ALL_FEATS.find((f) => f.id === id);
}

export function getFeatName(id: string): string {
  return getFeat(id)?.name ?? id;
}
