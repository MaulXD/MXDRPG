import tracksData from "@/data/character/subclass-tracks.json";
import { LEGACY_SUBCLASS_NAMES, migrateSubclassName } from "@/lib/character/legacy-names";
import { getClass } from "@/lib/character/rules";

export type TalentKind = "talent" | "ascension";

export type SubclassTalent = {
  level: number;
  id: string;
  name: string;
  kind: TalentKind;
  /** id do talento anterior na cadeia (nv 8→4, 12→8, 16→12) */
  requires: string | null;
};

export type SubclassTrack = {
  id: string;
  classId: string;
  subclass: string;
  specialty: string;
  diet: string;
  talents: SubclassTalent[];
};

export type CharacterTalent = {
  level: number;
  id: string;
  name: string;
};

const TRACKS: SubclassTrack[] = tracksData.tracks as SubclassTrack[];

const bySubclass = new Map<string, SubclassTrack>();
const byId = new Map<string, SubclassTrack>();

for (const track of TRACKS) {
  bySubclass.set(normalizeKey(track.subclass), track);
  byId.set(track.id, track);
}

/** Resolve nomes antigos gravados em fichas legadas. */
for (const [oldName, newName] of Object.entries(LEGACY_SUBCLASS_NAMES)) {
  const track = bySubclass.get(normalizeKey(newName));
  if (track) bySubclass.set(normalizeKey(oldName), track);
}

export const SUBCLASS_TRACKS = TRACKS;

export const TALENT_WINDOW_LEVELS = [4, 8, 12, 16] as const;
export const ASCENSION_LEVEL = 20;

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getSubclassTrack(subclass: string | null | undefined): SubclassTrack | null {
  if (!subclass) return null;
  const migrated = migrateSubclassName(subclass) ?? subclass;
  return bySubclass.get(normalizeKey(migrated)) ?? bySubclass.get(normalizeKey(subclass)) ?? null;
}

export function getTrackForClass(classId: string, subclass: string): SubclassTrack | null {
  const track = getSubclassTrack(subclass);
  if (!track || track.classId !== classId) return null;
  return track;
}

export function listTracksForClass(classId: string): SubclassTrack[] {
  return TRACKS.filter((t) => t.classId === classId);
}

export function getTalentById(track: SubclassTrack, talentId: string): SubclassTalent | null {
  return track.talents.find((t) => t.id === talentId) ?? null;
}

export function getTalentForLevel(track: SubclassTrack, level: number): SubclassTalent | null {
  return track.talents.find((t) => t.level === level) ?? null;
}

/** Talentos que o personagem pode escolher ao subir para `targetLevel` */
export function getAvailableTalents(
  track: SubclassTrack,
  owned: CharacterTalent[],
  targetLevel: number
): SubclassTalent[] {
  const talent = getTalentForLevel(track, targetLevel);
  if (!talent || talent.kind === "ascension") return [];
  if (targetLevel === ASCENSION_LEVEL) return [];

  if (!TALENT_WINDOW_LEVELS.includes(targetLevel as (typeof TALENT_WINDOW_LEVELS)[number])) {
    return [];
  }

  if (talent.requires) {
    const hasPrev = owned.some((t) => t.id === talent.requires);
    if (!hasPrev) return [];
  }

  return [talent];
}

export function parseCharacterTalents(raw: unknown): CharacterTalent[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") {
        const m = item.match(/^Nv(\d+):\s*(.+)$/);
        if (m) return { level: Number(m[1]), id: normalizeKey(m[2]), name: m[2] };
        return null;
      }
      if (item && typeof item === "object" && "id" in item && "level" in item) {
        const o = item as CharacterTalent;
        return { level: o.level, id: o.id, name: o.name };
      }
      return null;
    })
    .filter(Boolean) as CharacterTalent[];
}

export function validateTalentChoice(
  subclass: string | null | undefined,
  owned: CharacterTalent[],
  targetLevel: number,
  talentId: string
): string | null {
  const track = getSubclassTrack(subclass);
  if (!track) return "Escolha um Caminho de Assimilação (subclasse) antes do talento.";

  const options = getAvailableTalents(track, owned, targetLevel);
  if (!options.length) {
    if (targetLevel === 20) return null;
    const needed = getTalentForLevel(track, targetLevel);
    if (needed?.requires) {
      const prev = getTalentById(track, needed.requires);
      return `Requer talento nv ${targetLevel - 4}: ${prev?.name ?? needed.requires}.`;
    }
    return `Nenhum talento disponível no nv ${targetLevel}.`;
  }

  if (!options.some((t) => t.id === talentId)) {
    return "Talento inválido para esta trilha ou nível.";
  }

  if (owned.some((t) => t.level === targetLevel)) {
    return `Talento do nv ${targetLevel} já escolhido.`;
  }

  return null;
}

export function getAscension(track: SubclassTrack): SubclassTalent | null {
  return track.talents.find((t) => t.kind === "ascension") ?? null;
}

export function describeTrackProgress(
  track: SubclassTrack,
  owned: CharacterTalent[],
  currentLevel: number
): Array<{ level: number; label: string; state: "locked" | "available" | "done" | "future" }> {
  const ownedLevels = new Set(owned.map((t) => t.level));
  const rows: Array<{ level: number; label: string; state: "locked" | "available" | "done" | "future" }> = [
    { level: 2, label: `Dieta: ${track.diet}`, state: currentLevel >= 2 ? "done" : "future" },
  ];

  for (const t of track.talents) {
    let state: "locked" | "available" | "done" | "future" = "future";
    if (ownedLevels.has(t.level)) state = "done";
    else if (currentLevel + 1 === t.level && getAvailableTalents(track, owned, t.level).length) {
      state = "available";
    } else if (currentLevel >= t.level) state = "locked";
    rows.push({
      level: t.level,
      label: t.kind === "ascension" ? `Ascensão — ${t.name}` : t.name,
      state,
    });
  }
  return rows;
}

export function subclassMatchesClass(classId: string, subclass: string): boolean {
  const cls = getClass(classId);
  return cls?.subclasses.includes(subclass) ?? false;
}
