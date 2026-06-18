import { normalizeCharacter } from "@/lib/character/normalize";
import type { CharacterSheet } from "@/lib/character/types";
import type { CombatActionOption } from "@/lib/combat/types";
import { slugId } from "@/lib/compendium/format";
import type { CreatureSize } from "@/lib/vtt/creature-size";
import { defaultMovementFields } from "@/lib/vtt/movement";
import {
  getMonsterTemplate,
  type MonsterTemplate,
  type MonsterTier,
} from "@/lib/vtt/monsters";
import { monsterCombatActions } from "@/lib/vtt/monster-actions";
import type { Axial } from "@/lib/vtt/grid-math";
import type { BattleToken } from "@/lib/vtt/types";
import type { RoomActor, RoomState } from "./types";
import { normalizeRoomSettings } from "./settings";

export type GmCreationKind = "creature" | "npc";

export type GmCreationSource = {
  type: "blank" | "monster" | "actor";
  id?: string;
  label?: string;
};

export type GmCreatureStats = {
  tier: MonsterTier;
  vida: number;
  vidaMax: number;
  pa: number;
  paMax: number;
  defesa: number;
  walk: number;
  run: number;
  ameaca: number;
  forca: number;
  agilidade: number;
  creatureSize: CreatureSize;
  actions: CombatActionOption[];
  description?: string;
};

export type GmCreation = {
  id: string;
  name: string;
  kind: GmCreationKind;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  source: GmCreationSource;
  creature?: GmCreatureStats;
  npc?: CharacterSheet;
};

const MONSTER_COLORS = ["#8b4513", "#6b5344", "#4a6741", "#7a4a6a", "#556b2f"];

export function getRoomGmCreations(room: RoomState): Record<string, GmCreation> {
  return normalizeRoomSettings(room.settings).gmCreations ?? {};
}

export function setRoomGmCreations(
  room: RoomState,
  creations: Record<string, GmCreation>
): RoomState {
  return {
    ...room,
    settings: {
      ...normalizeRoomSettings(room.settings),
      gmCreations: creations,
    },
  };
}

export function canEditGmCreation(
  room: Pick<RoomState, "ownerId">,
  creation: GmCreation,
  userId: string | undefined,
  userRole?: string
): boolean {
  if (!userId) return false;
  if (userRole === "admin") return true;
  if (room.ownerId !== userId) return false;
  return creation.createdBy === userId || creation.createdBy === room.ownerId;
}

function newGmId(): string {
  return `gm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function finiteInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

export function sanitizeCreatureStats(creature: GmCreatureStats): GmCreatureStats {
  const vidaMax = Math.max(1, finiteInt(creature.vidaMax, 12));
  const paMax = Math.max(1, finiteInt(creature.paMax, 2));
  const pa = Math.max(1, Math.min(paMax, finiteInt(creature.pa, paMax)));
  const vida = Math.max(1, Math.min(vidaMax, finiteInt(creature.vida, vidaMax)));
  return {
    ...creature,
    vidaMax,
    vida,
    pa,
    paMax,
    defesa: Math.max(0, finiteInt(creature.defesa, 12)),
    walk: Math.max(1, finiteInt(creature.walk, 4)),
    run: Math.max(1, finiteInt(creature.run, 6)),
    forca: Math.max(1, finiteInt(creature.forca, 10)),
    agilidade: Math.max(1, finiteInt(creature.agilidade, 10)),
    ameaca: Math.max(0, finiteInt(creature.ameaca, 1)),
  };
}

function defaultCreatureStats(name: string): GmCreatureStats {
  return {
    tier: "mob",
    vida: 12,
    vidaMax: 12,
    pa: 2,
    paMax: 2,
    defesa: 12,
    walk: 4,
    run: 6,
    ameaca: 1,
    forca: 10,
    agilidade: 10,
    creatureSize: "medium",
    actions: [],
    description: `Criatura personalizada: ${name}`,
  };
}

function monsterToCreatureStats(template: MonsterTemplate): GmCreatureStats {
  const actions =
    template.actions.length > 0
      ? template.actions
      : monsterCombatActions(template.entryId);
  return {
    tier: template.tier,
    vida: template.vida,
    vidaMax: template.vidaMax,
    pa: template.pa,
    paMax: template.paMax,
    defesa: template.defesa,
    walk: template.walk,
    run: template.run,
    ameaca: template.ameaca,
    forca: template.forca,
    agilidade: template.agilidade,
    creatureSize: template.creatureSize,
    actions,
    description: template.description,
  };
}

function actorToNpcTemplate(actor: RoomActor, ownerId: string): CharacterSheet {
  const { revision: _r, gmAuthored: _g, gmTemplateId: _t, ...sheet } = actor;
  return normalizeCharacter({
    ...sheet,
    id: newGmId(),
    ownerId,
    adventureId: null,
    campaignRoomId: null,
    name: `${sheet.name} (cópia)`,
  });
}

function blankNpcTemplate(name: string, ownerId: string): CharacterSheet {
  const sheet: CharacterSheet = {
    id: newGmId(),
    ownerId,
    adventureId: null,
    name,
    biography: "",
    identity: {
      nivel: 1,
      xpTotal: 0,
      raca: "Humano",
      classe: "Guerreiro",
      antecedente: "Soldado",
    },
    attributes: {
      forca: 12,
      destreza: 10,
      constituicao: 12,
      inteligencia: 10,
      sabedoria: 10,
      carisma: 10,
    },
    culinary: {
      trinchar: 0,
      harmonizacao: 0,
      coccao: 0,
      estomagoDeFerro: 0,
    },
    resources: {
      vida: { value: 14, max: 14 },
      pontosAcao: { value: 3, max: 3 },
    },
    movement: { walk: 4, run: 6 },
    tactical: { defesa: 12, iniciativa: 0 },
    inventory: [],
  };
  return normalizeCharacter(sheet);
}

export type CreateGmCreationInput =
  | { kind: "blank"; name: string; creationKind: GmCreationKind }
  | { kind: "monster"; monsterEntryId: string }
  | { kind: "actor"; actorId: string };

export function buildGmCreation(
  room: RoomState,
  userId: string,
  input: CreateGmCreationInput
): GmCreation | null {
  const now = Date.now();
  const id = newGmId();

  if (input.kind === "blank") {
    const name = input.name.trim() || "Sem nome";
    if (input.creationKind === "creature") {
      return {
        id,
        name,
        kind: "creature",
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        source: { type: "blank" },
        creature: sanitizeCreatureStats(defaultCreatureStats(name)),
      };
    }
    return {
      id,
      name,
      kind: "npc",
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      source: { type: "blank" },
      npc: blankNpcTemplate(name, room.ownerId),
    };
  }

  if (input.kind === "monster") {
    const template = getMonsterTemplate(input.monsterEntryId);
    if (!template) return null;
    return {
      id,
      name: `${template.name} (custom)`,
      kind: "creature",
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      source: {
        type: "monster",
        id: template.entryId,
        label: template.name,
      },
      creature: sanitizeCreatureStats(monsterToCreatureStats(template)),
    };
  }

  const actor = room.actors[input.actorId];
  if (!actor) return null;
  const npc = actorToNpcTemplate(actor, room.ownerId);
  return {
    id,
    name: `${actor.name} (custom)`,
    kind: "npc",
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    source: {
      type: "actor",
      id: actor.id,
      label: actor.name,
    },
    npc: { ...npc, id: newGmId() },
  };
}

export function gmCreationCombatActions(creation: GmCreation): CombatActionOption[] {
  if (creation.kind !== "creature" || !creation.creature) return [];
  const stats = creation.creature;
  if (stats.actions.length > 0) {
    return stats.actions.map((a) => ({
      ...a,
      label: a.label ?? `${a.name} · ${a.rangeCells ?? 1} cél. · PA ${a.paCost}`,
    }));
  }
  if (creation.source.type === "monster" && creation.source.id) {
    return monsterCombatActions(creation.source.id);
  }
  return monsterCombatActions(creation.id);
}

export function createCreatureTokenFromGmCreation(
  creation: GmCreation,
  axial: Axial,
  tokenId?: string
): BattleToken | null {
  if (creation.kind !== "creature" || !creation.creature) return null;
  const stats = sanitizeCreatureStats(creation.creature);
  const actions = gmCreationCombatActions(creation);
  const id =
    tokenId ?? `m-gm-${slugId(creation.name) || "creature"}-${Date.now().toString(36).slice(-5)}`;
  const color = MONSTER_COLORS[stats.ameaca % MONSTER_COLORS.length];

  const baseLabel =
    creation.source.type === "monster"
      ? (creation.source.label ?? creation.name.replace(/\s*\(custom\)\s*$/i, ""))
      : creation.name.replace(/\s*\(custom\)\s*$/i, "");

  return {
    id,
    name: baseLabel || "Criatura",
    axial,
    color,
    walk: stats.walk,
    run: stats.run,
    pa: stats.pa,
    paMax: stats.paMax,
    ownerRole: "mestre",
    linked: false,
    nivel: stats.ameaca,
    vida: stats.vida,
    vidaMax: stats.vidaMax,
    defesa: stats.defesa,
    gmCreationId: creation.id,
    monsterEntryId:
      creation.source.type === "monster" ? creation.source.id : undefined,
    monsterTier: stats.tier,
    gmCreatureStats: {
      forca: stats.forca,
      agilidade: stats.agilidade,
      ameaca: stats.ameaca,
    },
    gmActions: actions,
    creatureSize: stats.creatureSize,
    ...defaultMovementFields({ walk: stats.walk, run: stats.run }),
  };
}

export function npcInstanceFromGmCreation(
  creation: GmCreation,
  room: RoomState
): RoomActor | null {
  if (creation.kind !== "npc" || !creation.npc) return null;
  const instanceId = `gm-inst-${creation.id.slice(0, 12)}-${Date.now().toString(36).slice(-4)}`;
  const sheet = normalizeCharacter({
    ...creation.npc,
    id: instanceId,
    ownerId: room.ownerId,
    adventureId: null,
    campaignRoomId: null,
    name: creation.name,
  });
  return {
    ...sheet,
    revision: 1,
    gmAuthored: true,
    gmTemplateId: creation.id,
  };
}

export function patchGmCreation(
  creation: GmCreation,
  patch: {
    name?: string;
    creature?: Partial<GmCreatureStats>;
    npc?: Partial<CharacterSheet>;
  }
): GmCreation {
  const next: GmCreation = {
    ...creation,
    updatedAt: Date.now(),
  };
  if (patch.name?.trim()) next.name = patch.name.trim();
  if (creation.kind === "creature" && creation.creature && patch.creature) {
    next.creature = sanitizeCreatureStats({ ...creation.creature, ...patch.creature });
  }
  if (creation.kind === "npc" && creation.npc && patch.npc) {
    next.npc = normalizeCharacter({ ...creation.npc, ...patch.npc, id: creation.npc.id });
  }
  return next;
}
