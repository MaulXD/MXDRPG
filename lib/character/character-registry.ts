import "server-only";

import fs from "fs";
import path from "path";
import { DEMO_CHARACTERS } from "@/lib/character/demo-characters";
import { normalizeCharacter } from "@/lib/character/normalize";
import type { CharacterSheet } from "@/lib/character/types";

const REGISTRY_PATH = path.join(process.cwd(), "data/characters/registry.json");

const SEED_CHARACTER_IDS = new Set(DEMO_CHARACTERS.map((c) => c.id));

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

function savePersisted(registry: Map<string, CharacterSheet>): void {
  const dir = path.dirname(REGISTRY_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const list = [...registry.values()].filter((c) => !SEED_CHARACTER_IDS.has(c.id));
  fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify(list, null, 2)}\n`, "utf8");
}

/** Registro em memória + arquivo local (modo sem Postgres). */
export function characterRegistry(): Map<string, CharacterSheet> {
  if (!globalThis.__eldarinCharacterRegistry) {
    const map = new Map<string, CharacterSheet>();
    for (const sheet of DEMO_CHARACTERS) {
      map.set(sheet.id, normalizeCharacter({ ...sheet }));
    }
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
  return [...characterRegistry().values()]
    .filter((c) => c.ownerId === ownerId)
    .map((c) => normalizeCharacter({ ...c }));
}

export function upsertCharacterRegistry(sheet: CharacterSheet): CharacterSheet {
  const normalized = normalizeCharacter(sheet);
  characterRegistry().set(normalized.id, normalized);

  const idx = DEMO_CHARACTERS.findIndex((c) => c.id === normalized.id);
  if (idx >= 0) DEMO_CHARACTERS[idx] = normalized;
  else if (SEED_CHARACTER_IDS.has(normalized.id)) {
    /* seed ids are fixed */
  } else {
    DEMO_CHARACTERS.push(normalized);
  }

  savePersisted(characterRegistry());

  return normalized;
}
