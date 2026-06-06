import "server-only";
import type { CharacterSheet } from "./types";
import {
  MAX_CHARACTERS_PER_USER_PER_ADVENTURE,
} from "./adventure-bind";
import { computeCulinary } from "./rules";
import { normalizeCharacter } from "./normalize";
import { dbEnabled } from "@/lib/db/enabled";
import { isAdventureMember } from "@/lib/auth/adventure-access";
import { getAdventure } from "@/lib/adventure/store";
import { syncAdventureActorsForRoom } from "@/lib/room/adventure-actors";
import {
  characterRegistry,
  getCharacterFromRegistry,
  listCharactersFromRegistry,
  upsertCharacterRegistry,
} from "./character-registry";
import { canEditCharacter } from "./demo-characters";

export { canEditCharacter };
export { MAX_CHARACTERS_PER_USER_PER_ADVENTURE } from "./adventure-bind";

declare global {
  // eslint-disable-next-line no-var
  var __eldarinDbCharactersSeeded: boolean | undefined;
}

async function ensureDbCharactersSeeded(): Promise<void> {
  if (!dbEnabled() || globalThis.__eldarinDbCharactersSeeded) return;
  const { upsertCharacter } = await import("@/lib/db/characters");
  for (const sheet of characterRegistry().values()) {
    await upsertCharacter(sheet);
  }
  globalThis.__eldarinDbCharactersSeeded = true;
}

export async function resolveCharacter(id: string): Promise<CharacterSheet | null> {
  const fromRegistry = getCharacterFromRegistry(id);

  if (dbEnabled()) {
    await ensureDbCharactersSeeded();
    try {
      const { fetchCharacter } = await import("@/lib/db/characters");
      const fromDb = await fetchCharacter(id);
      if (fromDb) return fromDb;
    } catch (e) {
      console.warn(
        "[eldarin] Postgres fetchCharacter falhou — usando registry:",
        e instanceof Error ? e.message : e
      );
    }
  }

  return fromRegistry;
}

export async function listCharactersForUser(userId: string): Promise<CharacterSheet[]> {
  const local = listCharactersFromRegistry(userId);

  if (dbEnabled()) {
    await ensureDbCharactersSeeded();
    const { listCharactersByOwner } = await import("@/lib/db/characters");
    const fromDb = await listCharactersByOwner(userId);
    const byId = new Map<string, CharacterSheet>();
    for (const sheet of fromDb) byId.set(sheet.id, sheet);
    for (const sheet of local) {
      if (sheet.ownerId === userId && !byId.has(sheet.id)) {
        byId.set(sheet.id, sheet);
      }
    }
    return [...byId.values()];
  }

  return local;
}

export async function listCharactersForUserInAdventure(
  userId: string,
  adventureId: string
): Promise<CharacterSheet[]> {
  const all = await listCharactersForUser(userId);
  return all.filter((c) => (c.adventureId ?? c.campaignRoomId) === adventureId);
}

export async function countCharactersForUserInAdventure(
  userId: string,
  adventureId: string
): Promise<number> {
  return (await listCharactersForUserInAdventure(userId, adventureId)).length;
}

export const MAX_CHARACTERS_PER_USER = 10;

export async function saveCharacter(sheet: CharacterSheet): Promise<CharacterSheet> {
  const normalized = normalizeCharacter(sheet);
  const saved = upsertCharacterRegistry(normalized);

  if (dbEnabled()) {
    try {
      const { upsertCharacter } = await import("@/lib/db/characters");
      await upsertCharacter(saved);
    } catch (e) {
      console.error(
        "[eldarin] Postgres upsertCharacter falhou (ficha salva em registry local):",
        e instanceof Error ? e.message : e
      );
      throw new Error(
        "Não foi possível gravar a ficha no banco. Rode npm run db:migrate ou verifique DATABASE_URL."
      );
    }
  }

  const verified = await resolveCharacter(saved.id);
  if (!verified) {
    throw new Error("Ficha criada mas não encontrada ao salvar — tente novamente");
  }

  return saved;
}

export async function createCharacterFromWizard(
  userId: string,
  draft: import("./wizard-types").CharacterWizardDraft,
  opts?: { adventureId?: string | null; roomId?: string | null }
): Promise<{ sheet: CharacterSheet; mesaRoomId: string | null }> {
  const existing = await listCharactersForUser(userId);
  if (existing.length >= MAX_CHARACTERS_PER_USER) {
    throw new Error(`Limite de ${MAX_CHARACTERS_PER_USER} fichas por conta`);
  }

  const adventureId =
    opts?.adventureId?.trim() || opts?.roomId?.trim() || null;
  if (adventureId) {
    const adventure = await getAdventure(adventureId);
    if (!adventure) throw new Error("Aventura não encontrada");
    if (!isAdventureMember(adventure, userId)) {
      throw new Error("Entre na aventura antes de criar a ficha");
    }
    const inAdv = await countCharactersForUserInAdventure(userId, adventure.adventureId);
    if (inAdv >= MAX_CHARACTERS_PER_USER_PER_ADVENTURE) {
      throw new Error("Você já tem um personagem nesta aventura");
    }
  }

  const { buildCharacterFromWizard } = await import("./build-from-wizard");
  const sheet = buildCharacterFromWizard(userId, draft, undefined, adventureId);
  const saved = await saveCharacter(sheet);

  const { attachCharacterToDemoRoom } = await import("@/lib/room/demo-character-sync");
  await attachCharacterToDemoRoom(saved);

  let mesaRoomId: string | null = null;
  if (adventureId) {
    const adv = await getAdventure(adventureId);
    if (adv) {
      mesaRoomId = adv.primaryRoomId;
      await syncAdventureActorsForRoom(adv.primaryRoomId);
    }
  }

  return { sheet: saved, mesaRoomId };
}

export async function createCharacter(
  userId: string,
  name: string
): Promise<CharacterSheet> {
  const existing = await listCharactersForUser(userId);
  if (existing.length >= MAX_CHARACTERS_PER_USER) {
    throw new Error(`Limite de ${MAX_CHARACTERS_PER_USER} fichas por conta`);
  }
  const sheet = normalizeCharacter({
    id: `pc-${Date.now().toString(36)}`,
    ownerId: userId,
    name: name.trim().slice(0, 80) || "Novo personagem",
    biography: "",
    identity: {
      nivel: 1,
      xpTotal: 0,
      raca: "Humano",
      classe: "Guerreiro",
      antecedente: "Aventureiro",
      talentos: [],
    },
    attributes: {
      forca: 12,
      destreza: 12,
      constituicao: 12,
      inteligencia: 10,
      sabedoria: 10,
      carisma: 10,
    },
    culinary: computeCulinary("Guerreiro", "Humano"),
    resources: {
      vida: { value: 20, max: 20 },
      pontosAcao: { value: 4, max: 4 },
    },
    movement: { walk: 4, run: 6 },
    tactical: { defesa: 11, iniciativa: 0 },
    inventory: [],
    combatLoadout: null,
    armorLoadout: null,
  });
  return saveCharacter(sheet);
}
