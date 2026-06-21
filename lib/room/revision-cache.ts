import "server-only";

const revisionCache = new Map<string, { rev: number; at: number }>();
const REVISION_CACHE_MS = 800;

export function readCachedRevision(roomId: string): number | null {
  const hit = revisionCache.get(roomId);
  if (!hit || Date.now() - hit.at > REVISION_CACHE_MS) return null;
  return hit.rev;
}

export function writeCachedRevision(roomId: string, rev: number): void {
  revisionCache.set(roomId, { rev, at: Date.now() });
}

export function invalidateRevisionCache(roomId: string): void {
  revisionCache.delete(roomId);
}
