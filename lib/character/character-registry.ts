import "server-only";

import fs from "fs";
import path from "path";
import { normalizeCharacter } from "@/lib/character/normalize";
import type { CharacterSheet } from "@/lib/character/types";

const REGISTRY_PATH = path.join(process.cwd(), "data/characters/registry.json");

declare global {
  // eslint-disable-next-line no-var
  var __eldarinCharacterRegistry: Map<string, CharacterSheet> | undefined;
}

function loadPersisted(): CharacterSheet[] {
  try {
    if (!fs.existsSync(REGISTRY_PATH)) return [];
    const raw = fs.readFileSync(REGISTRY_PATH, "utf8");
    const parsed = JSON.parse(raw) as CharacterSheet[];
    return Array.isArray(parsed) ? parsed.map((c) => normalizeCharacter(c)) : [];
  } catch {
    return [];
  }
}

function canWriteRegistryFile(): boolean {
  if (process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME) return false;
  const dir = path.dirname(REGISTRY_PATH);
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function savePersisted(registry: Map<string, CharacterSheet>): void {
  if (!canWriteRegistryFile()) return;
  try {
    const list = [...registry.values()];
    fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify(list, null, 2)}\n`, "utf8");
  } catch (e) {
    console.warn(
      "[eldarin] registry.json indisponível (somente memória/Postgres):",
      e instanceof Error ? e.message : e
    );
  }
}

/** Registro em memória + arquivo local (modo sem Postgres). */
export function characterRegistry(): Map<string, CharacterSheet> {
  if (!globalThis.__eldarinCharacterRegistry) {
    const map = new Map<string, CharacterSheet>();
    for (const sheet of loadPersisted()) {
      map.set(sheet.id, sheet);
    }
    globalThis.__eldarinCharacterRegistry = map;
  }
  return globalThis.__eldarinCharacterRegistry;
}

export function getCharacterFromRegistry(id: string): CharacterSheet | null {
  const sheet = characterRegistry().get(id);
  return sheet ? normalizeCharacter({ ...sheet }) : null;
}

export function listCharactersFromRegistry(ownerId: string): CharacterSheet[] {
  return listCharactersFromRegistryByOwners([ownerId]);
}

export function listCharactersFromRegistryByOwners(ownerIds: string[]): CharacterSheet[] {
  const allowed = new Set(ownerIds);
  return [...characterRegistry().values()]
    .filter((c) => allowed.has(c.ownerId))
    .map((c) => normalizeCharacter({ ...c }));
}

export function reassignRegistryCharacterOwners(
  fromOwnerIds: string[],
  toOwnerId: string
): number {
  const aliases = new Set(fromOwnerIds.filter((id) => id && id !== toOwnerId));
  if (aliases.size === 0) return 0;
  let count = 0;
  for (const [id, sheet] of characterRegistry()) {
    if (!aliases.has(sheet.ownerId)) continue;
    characterRegistry().set(id, normalizeCharacter({ ...sheet, ownerId: toOwnerId }));
    count += 1;
  }
  if (count > 0) savePersisted(characterRegistry());
  return count;
}

export function removeCharacterFromRegistry(id: string): void {
  characterRegistry().delete(id);
  savePersisted(characterRegistry());
}

export function upsertCharacterRegistry(sheet: CharacterSheet): CharacterSheet {
  const normalized = normalizeCharacter(sheet);
  characterRegistry().set(normalized.id, normalized);
  savePersisted(characterRegistry());
  return normalized;
}
