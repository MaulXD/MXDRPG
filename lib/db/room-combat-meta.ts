import type { CombatTrack } from "@/lib/room/combat";
import type { CombatLogEntry } from "@/lib/room/combat-log";
import type { RoomState } from "@/lib/room/types";

/** Chaves internas no JSONB `combat` — não fazem parte de `CombatTrack`. */
const COMBAT_LOG_KEY = "_combatLog";

type PersistedCombatJson = CombatTrack & {
  [COMBAT_LOG_KEY]?: CombatLogEntry[];
};

function isCombatLogEntry(value: unknown): value is CombatLogEntry {
  if (!value || typeof value !== "object") return false;
  const e = value as CombatLogEntry;
  return typeof e.id === "string" && typeof e.at === "number" && typeof e.kind === "string";
}

export function packCombatColumn(state: RoomState): PersistedCombatJson {
  return {
    ...state.combat,
    [COMBAT_LOG_KEY]: state.combatLog ?? [],
  };
}

export function unpackCombatColumn(raw: unknown): {
  combat: Partial<CombatTrack> | null | undefined;
  combatLog?: CombatLogEntry[];
} {
  if (!raw || typeof raw !== "object") {
    return { combat: raw as Partial<CombatTrack> | null | undefined };
  }

  const obj = raw as PersistedCombatJson;
  const combatLog = Array.isArray(obj[COMBAT_LOG_KEY])
    ? obj[COMBAT_LOG_KEY].filter(isCombatLogEntry)
    : undefined;

  const { [COMBAT_LOG_KEY]: _log, ...combat } = obj;
  return { combat, combatLog };
}
