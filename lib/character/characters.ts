import "server-only";
import type { SessionUser } from "@/lib/auth/types";
import {
  resolveCharacterAccount,
  resolveSessionCharacterAccount,
  type CharacterAccount,
} from "@/lib/auth/account-user";
import type { CharacterSheet } from "./types";
import {
  MAX_CHARACTERS_PER_USER_PER_ADVENTURE,
} from "./adventure-bind";
import { computeCulinary } from "./rules";
import { normalizeCharacter } from "./normalize";
import { dbEnabled } from "@/lib/db/enabled";
import { isAdventureMember } from "@/lib/auth/adventure-access";
import { bindPlayerToAdventure, getAdventure } from "@/lib/adventure/store";
import { syncAdventureActorsForRoom } from "@/lib/room/adventure-actors";
import {
  characterRegistry,
  getCharacterFromRegistry,
  listCharactersFromRegistryByOwners,
  reassignRegistryCharacterOwners,
  upsertCharacterRegistry,
} from "./character-registry";
import { canEditCharacter } from "./demo-characters";
import {
  canEditCharacterWithGrant,
  canStructuralSheetEditWithGrant,
  grantFromRequest,
} from "./edit-access";

export {
  canEditCharacter,
  canEditCharacterWithGrant,
  canStructuralSheetEditWithGrant,
  grantFromRequest,
};
export { MAX_CHARACTERS_PER_USER_PER_ADVENTURE } from "./adventure-bind";

declare global {
  // eslint-disable-next-line no-var
  var __eldarinDbCharactersSeeded: boolean | undefined;
}

async function ensureDbCharactersSeeded(): Promise<void> {
  if (!dbEnabled() || globalThis.__eldarinDbCharactersSeeded) return;
  try {
    const { upsertCharacter } = await import("@/lib/db/characters");
    for (const sheet of characterRegistry().values()) {
      await upsertCharacter(sheet);
    }
    globalThis.__eldarinDbCharactersSeeded = true;
  } catch (e) {
    console.warn(
      "[eldarin] seed de fichas demo no Postgres falhou — continuando sem seed:",
      e instanceof Error ? e.message : e
    );
  }
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

async function reconcileCharacterOwners(account: CharacterAccount): Promise<void> {
  const aliases = account.queryIds.filter((id) => id !== account.canonicalId);
  if (aliases.length === 0) return;

  reassignRegistryCharacterOwners(aliases, account.canonicalId);

  if (dbEnabled()) {
    try {
      const { reassignCharacterOwners } = await import("@/lib/db/characters");
      await reassignCharacterOwners(aliases, account.canonicalId);
    } catch (e) {
      console.warn(
        "[eldarin] reconcileCharacterOwners falhou:",
        e instanceof Error ? e.message : e
      );
    }
  }
}

function normalizeOwnerOnSheets(
  sheets: CharacterSheet[],
  canonicalId: string
): CharacterSheet[] {
  return sheets.map((sheet) =>
    sheet.ownerId === canonicalId ? sheet : { ...sheet, ownerId: canonicalId }
  );
}

export async function listCharactersForUser(
  userId: string,
  opts?: { clerkId?: string | null }
): Promise<CharacterSheet[]> {
  const account = await resolveCharacterAccount(userId, opts?.clerkId);
  await reconcileCharacterOwners(account);

  const local = listCharactersFromRegistryByOwners(account.queryIds);

  if (dbEnabled()) {
    await ensureDbCharactersSeeded();
    const { listCharactersByOwners } = await import("@/lib/db/characters");
    const fromDb = await listCharactersByOwners(account.queryIds);
    const byId = new Map<string, CharacterSheet>();
    for (const sheet of fromDb) byId.set(sheet.id, sheet);
    for (const sheet of local) {
      if (characterOwnedByQuery(sheet, account) && !byId.has(sheet.id)) {
        byId.set(sheet.id, sheet);
      }
    }
    return normalizeOwnerOnSheets([...byId.values()], account.canonicalId);
  }

  return normalizeOwnerOnSheets(local, account.canonicalId);
}

function characterOwnedByQuery(sheet: CharacterSheet, account: CharacterAccount): boolean {
  return account.queryIds.includes(sheet.ownerId);
}

/** Lista fichas da conta logada (materializa usuário + reconcilia aliases). */
export async function listCharactersForSessionUser(user: SessionUser): Promise<CharacterSheet[]> {
  const account = await resolveSessionCharacterAccount(user);
  return listCharactersForUser(account.canonicalId, { clerkId: account.clerkId });
}

export async function listCharactersForUserInAdventure(
  userId: string,
  adventureId: string,
  opts?: { clerkId?: string | null }
): Promise<CharacterSheet[]> {
  const all = await listCharactersForUser(userId, opts);
  return all.filter((c) => (c.adventureId ?? c.campaignRoomId) === adventureId);
}

export async function listCharactersForSessionUserInAdventure(
  user: SessionUser,
  adventureId: string
): Promise<CharacterSheet[]> {
  const account = await resolveSessionCharacterAccount(user);
  return listCharactersForUserInAdventure(account.canonicalId, adventureId, {
    clerkId: account.clerkId,
  });
}

export async function countCharactersForUserInAdventure(
  userId: string,
  adventureId: string,
  opts?: { clerkId?: string | null }
): Promise<number> {
  return (await listCharactersForUserInAdventure(userId, adventureId, opts)).length;
}

/** ID canônico da conta para gravar novas fichas. */
export async function canonicalOwnerIdForUser(
  userId: string,
  clerkId?: string | null
): Promise<string> {
  const account = await resolveCharacterAccount(userId, clerkId);
  await reconcileCharacterOwners(account);
  return account.canonicalId;
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
  opts?: {
    adventureId?: string | null;
    roomId?: string | null;
    clerkId?: string | null;
  }
): Promise<{ sheet: CharacterSheet; mesaRoomId: string | null }> {
  const ownerId = await canonicalOwnerIdForUser(userId, opts?.clerkId);
  const existing = await listCharactersForUser(ownerId, { clerkId: opts?.clerkId });
  if (existing.length >= MAX_CHARACTERS_PER_USER) {
    throw new Error(`Limite de ${MAX_CHARACTERS_PER_USER} fichas por conta`);
  }

  const adventureId =
    opts?.adventureId?.trim() || opts?.roomId?.trim() || null;
  if (adventureId) {
    let adventure = await getAdventure(adventureId);
    if (!adventure) throw new Error("Aventura não encontrada");
    if (!isAdventureMember(adventure, ownerId, opts?.clerkId)) {
      const { isRoomMemberResolved } = await import("@/lib/auth/room-access-server");
      const { getRoom } = await import("@/lib/room/internal/registry");
      const room = adventure.primaryRoomId ? await getRoom(adventure.primaryRoomId) : null;
      if (room && (await isRoomMemberResolved(room, ownerId, opts?.clerkId))) {
        adventure = (await bindPlayerToAdventure(adventure.adventureId, ownerId)) ?? adventure;
      }
    }
    if (!isAdventureMember(adventure, ownerId, opts?.clerkId)) {
      throw new Error("Entre na aventura antes de criar a ficha");
    }
    const inAdv = await countCharactersForUserInAdventure(ownerId, adventure.adventureId, {
      clerkId: opts?.clerkId,
    });
    if (inAdv >= MAX_CHARACTERS_PER_USER_PER_ADVENTURE) {
      throw new Error("Você já tem um personagem nesta aventura");
    }
  }

  const { buildCharacterFromWizard } = await import("./build-from-wizard");
  const { normalizeWizardDraftImages } = await import("./normalize-wizard-images");
  const normalizedDraft = await normalizeWizardDraftImages(draft);
  const sheet = buildCharacterFromWizard(ownerId, normalizedDraft, undefined, adventureId);
  const saved = await saveCharacter(sheet);

  const { attachCharacterToDemoRoom } = await import("@/lib/room/demo-character-sync");
  await attachCharacterToDemoRoom(saved);

  let mesaRoomId: string | null = null;
  if (adventureId) {
    const adv = await getAdventure(adventureId);
    if (adv) {
      await bindPlayerToAdventure(adv.adventureId, ownerId);
      mesaRoomId = adv.primaryRoomId;
      const { attachCharacterToRoomState } = await import("@/lib/room/adventure-actors");
      const { getRoom, persistRoom } = await import("@/lib/room/internal/registry");
      const room = await getRoom(adv.primaryRoomId);
      if (room && attachCharacterToRoomState(room, saved)) {
        await persistRoom(adv.primaryRoomId, room);
      }
      await syncAdventureActorsForRoom(adv.primaryRoomId);
    }
  }

  return { sheet: saved, mesaRoomId };
}

export async function createCharacter(
  userId: string,
  name: string,
  opts?: { clerkId?: string | null }
): Promise<CharacterSheet> {
  const ownerId = await canonicalOwnerIdForUser(userId, opts?.clerkId);
  const existing = await listCharactersForUser(ownerId, { clerkId: opts?.clerkId });
  if (existing.length >= MAX_CHARACTERS_PER_USER) {
    throw new Error(`Limite de ${MAX_CHARACTERS_PER_USER} fichas por conta`);
  }
  const { applyStarterKitToSheet, getDefaultStarterKitId } = await import("./starter-kits");
  const shell = normalizeCharacter({
    id: `pc-${Date.now().toString(36)}`,
    ownerId,
    name: name.trim().slice(0, 80) || "Novo personagem",
    biography: "",
    identity: {
      nivel: 1,
      xpTotal: 0,
      raca: "Humano",
      classe: "Guerreiro",
      antecedente: "Explorador",
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
  const sheet = applyStarterKitToSheet(shell, {
    classe: "Guerreiro",
    raca: "Humano",
    antecedente: "Explorador",
    starterKitId: getDefaultStarterKitId("Guerreiro"),
  });
  return saveCharacter(sheet);
}
