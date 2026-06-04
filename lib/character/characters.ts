import "server-only";
import type { CharacterSheet } from "./types";
import { computeCulinary } from "./rules";
import { normalizeCharacter } from "./normalize";
import { dbEnabled } from "@/lib/db/enabled";
import {
  DEMO_CHARACTERS,
  getCharacter,
  canEditCharacter,
} from "./demo-characters";

export { getCharacter, canEditCharacter };

declare global {
  // eslint-disable-next-line no-var
  var __eldarinDbCharactersSeeded: boolean | undefined;
}

async function ensureDbCharactersSeeded(): Promise<void> {
  if (!dbEnabled() || globalThis.__eldarinDbCharactersSeeded) return;
  const { upsertCharacter } = await import("@/lib/db/characters");
  for (const sheet of DEMO_CHARACTERS) {
    await upsertCharacter(sheet);
  }
  globalThis.__eldarinDbCharactersSeeded = true;
}

export async function resolveCharacter(id: string): Promise<CharacterSheet | null> {
  if (dbEnabled()) {
    await ensureDbCharactersSeeded();
    const { fetchCharacter } = await import("@/lib/db/characters");
    const fromDb = await fetchCharacter(id);
    if (fromDb) return fromDb;
  }
  return getCharacter(id);
}

export async function listCharactersForUser(userId: string): Promise<CharacterSheet[]> {
  if (dbEnabled()) {
    await ensureDbCharactersSeeded();
    const { listCharactersByOwner } = await import("@/lib/db/characters");
    return listCharactersByOwner(userId);
  }
  return DEMO_CHARACTERS.filter((c) => c.ownerId === userId).map((c) =>
    normalizeCharacter({ ...c })
  );
}

export const MAX_CHARACTERS_PER_USER = 10;

export async function saveCharacter(sheet: CharacterSheet): Promise<CharacterSheet> {
  const normalized = normalizeCharacter(sheet);
  const idx = DEMO_CHARACTERS.findIndex((c) => c.id === normalized.id);
  if (idx >= 0) DEMO_CHARACTERS[idx] = normalized;
  else DEMO_CHARACTERS.push(normalized);

  if (dbEnabled()) {
    const { upsertCharacter } = await import("@/lib/db/characters");
    await upsertCharacter(normalized);
  }
  return normalized;
}

export async function createCharacterFromWizard(
  userId: string,
  draft: import("./wizard-types").CharacterWizardDraft
): Promise<CharacterSheet> {
  const existing = await listCharactersForUser(userId);
  if (existing.length >= MAX_CHARACTERS_PER_USER) {
    throw new Error(`Limite de ${MAX_CHARACTERS_PER_USER} fichas por conta`);
  }
  const { buildCharacterFromWizard } = await import("./build-from-wizard");
  const sheet = buildCharacterFromWizard(userId, draft);
  return saveCharacter(sheet);
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
  });
  return saveCharacter(sheet);
}
