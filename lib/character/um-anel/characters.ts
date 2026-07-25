import "server-only";
import type { SessionUser } from "@/lib/auth/types";
import {
  resolveCharacterAccount,
  resolveSessionCharacterAccountSafe,
} from "@/lib/auth/account-user";
import { dbEnabled } from "@/lib/db/enabled";
import { isAdventureMember } from "@/lib/auth/adventure-access";
import { getAdventure, bindPlayerToAdventure } from "@/lib/adventure/store";
import { buildTorCharacterFromWizard } from "./build-from-wizard";
import { normalizeTorCharacter } from "./normalize";
import {
  getTorCharacterFromRegistry,
  listTorCharactersFromRegistryByOwners,
  upsertTorCharacterRegistry,
} from "./registry";
import type { TorCharacterSheet, TorResourcePatch } from "./types";
import type { TorCharacterWizardDraft } from "./wizard-types";

export type { TorResourcePatch };

/** Uma ficha do Um Anel por conta — pool separado do limite de fichas Eldarin. */
export const MAX_TOR_CHARACTERS_PER_USER = 10;

export async function resolveTorCharacter(id: string): Promise<TorCharacterSheet | null> {
  if (dbEnabled()) {
    try {
      const { fetchTorCharacter } = await import("@/lib/db/um-anel-characters");
      const fromDb = await fetchTorCharacter(id);
      if (fromDb) return fromDb;
    } catch (e) {
      console.warn(
        "[um-anel] MariaDB fetchTorCharacter falhou — usando registry:",
        e instanceof Error ? e.message : e
      );
    }
  }
  return getTorCharacterFromRegistry(id);
}

export async function listTorCharactersForUser(
  userId: string,
  opts?: { clerkId?: string | null }
): Promise<TorCharacterSheet[]> {
  const account = await resolveCharacterAccount(userId, opts?.clerkId);
  const local = listTorCharactersFromRegistryByOwners(account.queryIds);

  if (dbEnabled()) {
    const { listTorCharactersByOwners } = await import("@/lib/db/um-anel-characters");
    const fromDb = await listTorCharactersByOwners(account.queryIds);
    const byId = new Map<string, TorCharacterSheet>();
    for (const sheet of fromDb) byId.set(sheet.id, sheet);
    for (const sheet of local) if (!byId.has(sheet.id)) byId.set(sheet.id, sheet);
    return [...byId.values()];
  }

  return local;
}

export async function listTorCharactersForSessionUserSafe(
  user: SessionUser
): Promise<TorCharacterSheet[]> {
  try {
    const account = await resolveSessionCharacterAccountSafe(user);
    return await listTorCharactersForUser(account.canonicalId, { clerkId: account.clerkId });
  } catch (err) {
    console.error("[listTorCharactersForSessionUserSafe]", err);
    return [];
  }
}

export async function listTorCharactersForUserInAdventure(
  userId: string,
  adventureId: string,
  opts?: { clerkId?: string | null }
): Promise<TorCharacterSheet[]> {
  const all = await listTorCharactersForUser(userId, opts);
  return all.filter((c) => c.adventureId === adventureId);
}

/** Todos os personagens do Um Anel de uma aventura, de todos os membros — espelha
 * lib/room/adventure-actors.ts::resolvedParticipantIds (fan-out por conta canônica). */
export async function listTorCharactersForAdventure(adventureId: string): Promise<TorCharacterSheet[]> {
  const adventure = await getAdventure(adventureId);
  if (!adventure) return [];
  const rawIds = [...new Set([adventure.ownerId, ...adventure.memberIds])];
  const accounts = await Promise.all(rawIds.map((id) => resolveCharacterAccount(id)));
  const resolvedIds = [...new Set(accounts.map((a) => a.canonicalId))];
  const lists = await Promise.all(resolvedIds.map((id) => listTorCharactersForUserInAdventure(id, adventureId)));
  const byId = new Map<string, TorCharacterSheet>();
  for (const list of lists) for (const c of list) byId.set(c.id, c);
  return [...byId.values()];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Only o dono da ficha ou o mestre da aventura podem ajustar recursos durante a sessão. */
export async function patchTorCharacterResources(
  characterId: string,
  patch: TorResourcePatch,
  requesterUserId: string,
  opts?: { clerkId?: string | null }
): Promise<TorCharacterSheet> {
  const sheet = await resolveTorCharacter(characterId);
  if (!sheet) throw new Error("Ficha não encontrada");

  const requesterAccount = await resolveCharacterAccount(requesterUserId, opts?.clerkId);
  const isOwner = requesterAccount.canonicalId === sheet.ownerId;
  let isGm = false;
  if (!isOwner && sheet.adventureId) {
    const adventure = await getAdventure(sheet.adventureId);
    if (adventure) {
      const ownerAccount = await resolveCharacterAccount(adventure.ownerId);
      isGm = ownerAccount.canonicalId === requesterAccount.canonicalId;
    }
  }
  if (!isOwner && !isGm) throw new Error("Sem permissão pra editar essa ficha");

  const next: TorCharacterSheet = {
    ...sheet,
    endurance: {
      ...sheet.endurance,
      value:
        patch.enduranceValue !== undefined
          ? clamp(patch.enduranceValue, 0, sheet.endurance.max)
          : sheet.endurance.value,
    },
    hope: {
      ...sheet.hope,
      value: patch.hopeValue !== undefined ? clamp(patch.hopeValue, 0, sheet.hope.max) : sheet.hope.value,
    },
    shadow: patch.shadow !== undefined ? Math.max(0, patch.shadow) : sheet.shadow,
    shadowScars: patch.shadowScars !== undefined ? Math.max(0, patch.shadowScars) : sheet.shadowScars,
    fatigue: patch.fatigue !== undefined ? Math.max(0, patch.fatigue) : sheet.fatigue,
    treasure: patch.treasure !== undefined ? Math.max(0, patch.treasure) : sheet.treasure,
    fellowship: patch.fellowship !== undefined ? Math.max(0, patch.fellowship) : sheet.fellowship,
    injury: patch.injury !== undefined ? patch.injury : sheet.injury,
    conditions: {
      ...sheet.conditions,
      wounded: patch.wounded !== undefined ? patch.wounded : sheet.conditions.wounded,
    },
  };

  return saveTorCharacter(normalizeTorCharacter(next));
}

export async function saveTorCharacter(sheet: TorCharacterSheet): Promise<TorCharacterSheet> {
  const saved = upsertTorCharacterRegistry(sheet);

  if (dbEnabled()) {
    try {
      const { upsertTorCharacter } = await import("@/lib/db/um-anel-characters");
      await upsertTorCharacter(saved);
    } catch (e) {
      console.error(
        "[um-anel] MariaDB upsertTorCharacter falhou (ficha salva em registry local):",
        e instanceof Error ? e.message : e
      );
      throw new Error(
        "Não foi possível gravar a ficha no banco. Rode npm run db:migrate ou verifique DATABASE_URL."
      );
    }
  }

  return saved;
}

export async function createTorCharacterFromWizard(
  userId: string,
  draft: TorCharacterWizardDraft,
  opts?: { adventureId?: string | null; clerkId?: string | null }
): Promise<{ sheet: TorCharacterSheet }> {
  const account = await resolveCharacterAccount(userId, opts?.clerkId);
  const ownerId = account.canonicalId;
  const existing = await listTorCharactersForUser(ownerId, { clerkId: opts?.clerkId });
  if (existing.length >= MAX_TOR_CHARACTERS_PER_USER) {
    throw new Error(`Limite de ${MAX_TOR_CHARACTERS_PER_USER} fichas por conta`);
  }

  const adventureId = opts?.adventureId?.trim() || null;
  if (adventureId) {
    const adventure = await getAdventure(adventureId);
    if (!adventure) throw new Error("Aventura não encontrada");
    if (!isAdventureMember(adventure, ownerId, opts?.clerkId)) {
      throw new Error("Entre na aventura antes de criar a ficha");
    }
  }

  const sheet = buildTorCharacterFromWizard(ownerId, draft, adventureId);
  const saved = await saveTorCharacter(sheet);

  if (adventureId) {
    const adv = await getAdventure(adventureId);
    if (adv) await bindPlayerToAdventure(adv.adventureId, ownerId);
  }

  return { sheet: saved };
}
