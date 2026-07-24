import "server-only";

import fs from "fs";
import path from "path";
import { normalizeTorCharacter } from "./normalize";
import type { TorCharacterSheet } from "./types";

const REGISTRY_PATH = path.join(process.cwd(), "data/characters/um-anel-registry.json");

declare global {
  // eslint-disable-next-line no-var
  var __umAnelCharacterRegistry: Map<string, TorCharacterSheet> | undefined;
}

function loadPersisted(): TorCharacterSheet[] {
  try {
    if (!fs.existsSync(REGISTRY_PATH)) return [];
    const raw = fs.readFileSync(REGISTRY_PATH, "utf8");
    const parsed = JSON.parse(raw) as TorCharacterSheet[];
    return Array.isArray(parsed) ? parsed.map((c) => normalizeTorCharacter(c)) : [];
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

function savePersisted(registry: Map<string, TorCharacterSheet>): void {
  if (!canWriteRegistryFile()) return;
  try {
    fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify([...registry.values()], null, 2)}\n`, "utf8");
  } catch (e) {
    console.warn(
      "[um-anel] registry.json indisponível (somente memória/MariaDB):",
      e instanceof Error ? e.message : e
    );
  }
}

/** Registro em memória + arquivo local (modo sem MariaDB) — separado do registry Eldarin. */
export function torCharacterRegistry(): Map<string, TorCharacterSheet> {
  if (!globalThis.__umAnelCharacterRegistry) {
    const map = new Map<string, TorCharacterSheet>();
    for (const sheet of loadPersisted()) map.set(sheet.id, sheet);
    globalThis.__umAnelCharacterRegistry = map;
  }
  return globalThis.__umAnelCharacterRegistry;
}

export function getTorCharacterFromRegistry(id: string): TorCharacterSheet | null {
  const sheet = torCharacterRegistry().get(id);
  return sheet ? normalizeTorCharacter({ ...sheet }) : null;
}

export function listTorCharactersFromRegistryByOwners(ownerIds: string[]): TorCharacterSheet[] {
  const allowed = new Set(ownerIds);
  return [...torCharacterRegistry().values()]
    .filter((c) => allowed.has(c.ownerId))
    .map((c) => normalizeTorCharacter({ ...c }));
}

export function upsertTorCharacterRegistry(sheet: TorCharacterSheet): TorCharacterSheet {
  const normalized = normalizeTorCharacter(sheet);
  torCharacterRegistry().set(normalized.id, normalized);
  savePersisted(torCharacterRegistry());
  return normalized;
}

export function removeTorCharacterFromRegistry(id: string): void {
  torCharacterRegistry().delete(id);
  savePersisted(torCharacterRegistry());
}
