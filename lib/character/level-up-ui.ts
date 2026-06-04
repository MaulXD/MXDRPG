import { getEntry } from "@/lib/compendium/registry";
import type { CharacterSheet } from "@/lib/character/types";
import type { LevelUpChoices } from "@/lib/character/level-up";
import {
  canLevelUp,
  getLevelUpRequirements,
  previewLevelUp,
} from "@/lib/character/level-up";
import { habilidadeEntryForTalent } from "@/lib/character/subclass-vtt";
import {
  getAvailableTalents,
  getSubclassTrack,
  listTracksForClass,
  parseCharacterTalents,
  type CharacterTalent,
  type SubclassTalent,
  type SubclassTrack,
} from "@/lib/character/subclass-tracks";

export type TalentTreeNodeState =
  | "owned"
  | "selectable"
  | "locked"
  | "future"
  | "ascension";

export type TalentTreeNode = {
  key: string;
  level: number;
  label: string;
  kind: "diet" | "talent" | "ascension";
  state: TalentTreeNodeState;
  talentId?: string;
  requiresId?: string | null;
  blurb?: string;
};

export type LevelUpWizardStep =
  | { type: "overview" }
  | { type: "subclass" }
  | { type: "asi"; points: number }
  | { type: "talent"; level: number }
  | { type: "ascension"; name: string }
  | { type: "confirm" };

export type LevelUpPreviewGroup = {
  id: string;
  title: string;
  lines: string[];
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function talentBlurb(track: SubclassTrack, talent: SubclassTalent): string {
  const entryId = habilidadeEntryForTalent(talent, track.classId);
  if (entryId) {
    const entry = getEntry("habilidades", entryId);
    const raw = entry?.system?.description;
    if (typeof raw === "string" && raw.trim()) {
      const text = stripHtml(raw);
      return text.length > 140 ? `${text.slice(0, 137)}…` : text;
    }
  }
  if (talent.kind === "ascension") return `Capstone nv20 — ${talent.name}`;
  return `Talento de trilha nv${talent.level}`;
}

export function buildTalentTreeNodes(
  track: SubclassTrack,
  owned: CharacterTalent[],
  actorLevel: number,
  pickingLevel?: number,
  selectedId?: string
): TalentTreeNode[] {
  const ownedIds = new Set(owned.map((t) => t.id));
  const ownedLevels = new Set(owned.map((t) => t.level));
  const nodes: TalentTreeNode[] = [
    {
      key: "diet",
      level: 2,
      label: "Dieta Marcial",
      kind: "diet",
      state:
        actorLevel >= 2 ? "owned" : pickingLevel === 2 ? "selectable" : "future",
      blurb: track.diet,
    },
  ];

  for (const talent of track.talents) {
    let state: TalentTreeNodeState = "future";
    if (ownedIds.has(talent.id) || ownedLevels.has(talent.level)) {
      state = "owned";
    } else if (talent.kind === "ascension") {
      state = actorLevel >= 20 ? "ascension" : pickingLevel === 20 ? "ascension" : "future";
    } else if (pickingLevel === talent.level) {
      const available = getAvailableTalents(track, owned, talent.level);
      if (available.some((t) => t.id === talent.id)) state = "selectable";
      else if (selectedId === talent.id) state = "selectable";
      else state = "locked";
    } else if (actorLevel >= talent.level) {
      state = "locked";
    }

    nodes.push({
      key: talent.id,
      level: talent.level,
      label: talent.name,
      kind: talent.kind === "ascension" ? "ascension" : "talent",
      state,
      talentId: talent.id,
      requiresId: talent.requires,
      blurb: talentBlurb(track, talent),
    });
  }

  return nodes;
}

export function getLevelUpWizardSteps(actor: CharacterSheet): LevelUpWizardStep[] {
  if (!canLevelUp(actor)) return [];
  const reqs = getLevelUpRequirements(actor);
  const steps: LevelUpWizardStep[] = [{ type: "overview" }];

  if (reqs.some((r) => r.kind === "subclasse")) steps.push({ type: "subclass" });
  const asi = reqs.find((r) => r.kind === "asi");
  if (asi) steps.push({ type: "asi", points: asi.points });
  const talent = reqs.find((r) => r.kind === "talento");
  if (talent) steps.push({ type: "talent", level: talent.level });
  const asc = reqs.find((r) => r.kind === "ascension");
  if (asc) steps.push({ type: "ascension", name: asc.name });
  steps.push({ type: "confirm" });

  return steps;
}

export function previewLevelUpGroups(
  actor: CharacterSheet,
  choices?: LevelUpChoices
): LevelUpPreviewGroup[] {
  const lines = previewLevelUp(actor, choices);
  if (!lines.length) return [];

  const groups: LevelUpPreviewGroup[] = [
    { id: "core", title: "Neste nível", lines: [] },
    { id: "class", title: "Classe e trilha", lines: [] },
    { id: "choice", title: "Suas escolhas", lines: [] },
  ];

  for (const line of lines) {
    if (
      line.startsWith("Nível") ||
      line.startsWith("+") ||
      line.includes("HP") ||
      line.includes("PA") ||
      line.includes("proficiência") ||
      line.includes("Cura")
    ) {
      groups[0].lines.push(line);
    } else if (
      line.startsWith("Marco racial") ||
      line.startsWith("Dieta") ||
      line.startsWith("Ascensão") ||
      line.startsWith("Ataque") ||
      line.startsWith("Afinidade") ||
      line.startsWith("Talento do Caminho")
    ) {
      groups[1].lines.push(line);
    } else if (line.startsWith("Talento:")) {
      groups[2].lines.push(line);
    } else {
      groups[1].lines.push(line);
    }
  }

  if (choices?.asi) {
    const picks = Object.entries(choices.asi)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k.toUpperCase()} +${v}`);
    if (picks.length) groups[2].lines.push(`Atributos: ${picks.join(", ")}`);
  }
  if (choices?.subclasse) {
    groups[2].lines.push(`Subclasse: ${choices.subclasse}`);
  }

  return groups.filter((g) => g.lines.length > 0);
}

export function listSubclassOptions(classId: string): SubclassTrack[] {
  return listTracksForClass(classId);
}

export function resolveTrackForWizard(
  actor: CharacterSheet,
  subclasseDraft: string | undefined
): SubclassTrack | null {
  return getSubclassTrack(subclasseDraft || actor.identity.subclasse);
}
