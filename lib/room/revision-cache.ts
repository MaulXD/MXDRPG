import "server-only";

declare global {
  // eslint-disable-next-line no-var
  var __eldarinRevisionCache: Map<string, { rev: number; at: number }> | undefined;
}

const REVISION_CACHE_MS = 800;

/**
 * Cache curto da revisao da sala (BV-048, singleton). Fica em globalThis: cada rota do Next
 * pode carregar a propria copia deste modulo; com o Map no modulo, a rota SSE nao via as
 * revisoes gravadas pelas outras rotas (getRoom chamado de PATCH, por exemplo).
 */
function revisionCache(): Map<string, { rev: number; at: number }> {
  if (!globalThis.__eldarinRevisionCache) {
    globalThis.__eldarinRevisionCache = new Map();
  }
  return globalThis.__eldarinRevisionCache;
}

export function readCachedRevision(roomId: string): number | null {
  const hit = revisionCache().get(roomId);
  if (!hit || Date.now() - hit.at > REVISION_CACHE_MS) return null;
  return hit.rev;
}

export function writeCachedRevision(roomId: string, rev: number): void {
  revisionCache().set(roomId, { rev, at: Date.now() });
}

export function invalidateRevisionCache(roomId: string): void {
  revisionCache().delete(roomId);
}
