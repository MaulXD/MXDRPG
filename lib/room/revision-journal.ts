import type { RoomSnapshot } from "@/lib/room/types";

/** Snapshots por revision — ring buffer para sync incremental (Fase A). */
const MAX_REVISIONS = 80;

type RoomRevisionJournal = {
  byRevision: Map<number, RoomSnapshot>;
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

/** Grava snapshot canonico após persistRoom (revision já incrementada). */
export function recordSnapshotAtRevision(roomId: string, snapshot: RoomSnapshot): void {
  const journal = getJournal(roomId);
  const rev = snapshot.revision;
  if (journal.byRevision.has(rev)) return;

  journal.byRevision.set(rev, snapshot);
  journal.order.push(rev);

  while (journal.order.length > MAX_REVISIONS) {
    const oldest = journal.order.shift();
    if (oldest != null) journal.byRevision.delete(oldest);
  }
}

export function getSnapshotAtRevision(roomId: string, revision: number): RoomSnapshot | null {
  if (revision <= 0) return null;
  return getJournal(roomId).byRevision.get(revision) ?? null;
}

export function hasSnapshotAtRevision(roomId: string, revision: number): boolean {
  return getJournal(roomId).byRevision.has(revision);
}

/** Baseline após load do DB — permite delta na primeira mutação pós-restart. */
export function ensureJournalBaseline(roomId: string, snapshot: RoomSnapshot): void {
  if (!hasSnapshotAtRevision(roomId, snapshot.revision)) {
    recordSnapshotAtRevision(roomId, snapshot);
  }
}

/** Utilitário de teste / debug. */
export function clearRevisionJournal(roomId?: string): void {
  if (roomId) journals().delete(roomId);
  else journals().clear();
}
