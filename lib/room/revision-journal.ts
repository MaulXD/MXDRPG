import type { RoomSnapshot } from "@/lib/room/types";
import type { RoomDelta } from "@/lib/room/room-delta";

/** Snapshots + deltas por revision — ring buffer para sync incremental. */
const MAX_REVISIONS = 80;

type RevisionEntry = {
  snapshot: RoomSnapshot;
  /** Delta canonico (before→after) gravado no persist — evita recomputar no GET. */
  delta: RoomDelta;
};

type RoomRevisionJournal = {
  byRevision: Map<number, RevisionEntry>;
  order: number[];
};

declare global {
  // eslint-disable-next-line no-var
  var __eldarinRevisionJournal: Map<string, RoomRevisionJournal> | undefined;
}

function journals(): Map<string, RoomRevisionJournal> {
  if (!globalThis.__eldarinRevisionJournal) {
    globalThis.__eldarinRevisionJournal = new Map();
  }
  return globalThis.__eldarinRevisionJournal;
}

function getJournal(roomId: string): RoomRevisionJournal {
  const map = journals();
  let journal = map.get(roomId);
  if (!journal) {
    journal = { byRevision: new Map(), order: [] };
    map.set(roomId, journal);
  }
  return journal;
}

function pruneJournal(journal: RoomRevisionJournal): void {
  while (journal.order.length > MAX_REVISIONS) {
    const oldest = journal.order.shift();
    if (oldest != null) journal.byRevision.delete(oldest);
  }
}

/** Grava snapshot + delta após persistRoom (revision já incrementada). */
export function recordRevisionEntry(
  roomId: string,
  snapshot: RoomSnapshot,
  delta: RoomDelta
): void {
  const journal = getJournal(roomId);
  const rev = snapshot.revision;
  if (journal.byRevision.has(rev)) return;

  journal.byRevision.set(rev, { snapshot, delta });
  journal.order.push(rev);
  pruneJournal(journal);
}

/** @deprecated Prefer recordRevisionEntry — baseline sem delta. */
export function recordSnapshotAtRevision(roomId: string, snapshot: RoomSnapshot): void {
  const journal = getJournal(roomId);
  const rev = snapshot.revision;
  if (journal.byRevision.has(rev)) return;

  journal.byRevision.set(rev, {
    snapshot,
    delta: {
      kind: "delta",
      roomId: snapshot.roomId,
      revision: rev,
    },
  });
  journal.order.push(rev);
  pruneJournal(journal);
}

export function getSnapshotAtRevision(roomId: string, revision: number): RoomSnapshot | null {
  if (revision <= 0) return null;
  return getJournal(roomId).byRevision.get(revision)?.snapshot ?? null;
}

export function getDeltaAtRevision(roomId: string, revision: number): RoomDelta | null {
  if (revision <= 0) return null;
  return getJournal(roomId).byRevision.get(revision)?.delta ?? null;
}

/** Deltas canonicos (sinceRev, current] — ordem crescente. */
export function getCanonicalDeltasSince(
  roomId: string,
  sinceRev: number,
  currentRev: number
): RoomDelta[] {
  if (sinceRev >= currentRev) return [];
  const journal = getJournal(roomId);
  const out: RoomDelta[] = [];
  for (const rev of journal.order) {
    if (rev <= sinceRev) continue;
    if (rev > currentRev) break;
    const entry = journal.byRevision.get(rev);
    if (entry?.delta) out.push(entry.delta);
  }
  return out;
}

export function hasSnapshotAtRevision(roomId: string, revision: number): boolean {
  return getJournal(roomId).byRevision.has(revision);
}

/** Baseline só quando journal vazio (ex.: load DB pós-restart). */
export function ensureJournalBaseline(roomId: string, snapshot: RoomSnapshot): void {
  const journal = getJournal(roomId);
  if (journal.order.length === 0) {
    recordSnapshotAtRevision(roomId, snapshot);
  }
}

export function clearRevisionJournal(roomId?: string): void {
  if (roomId) journals().delete(roomId);
  else journals().clear();
}
