import "server-only";

import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { dbEnabled } from "@/lib/db/enabled";
import * as dbJoinTokens from "@/lib/db/join-tokens";
import type { Adventure } from "@/lib/adventure/types";
import { isAdventureClosed } from "@/lib/adventure/access";

export type JoinTokenRecord = {
  id: string;
  adventureId: string;
  tokenHash: string;
  createdBy: string;
  usedBy: string | null;
  usedAt: number | null;
  createdAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __eldarinJoinTokens: Map<string, JoinTokenRecord> | undefined;
}

function memoryStore(): Map<string, JoinTokenRecord> {
  if (!globalThis.__eldarinJoinTokens) {
    globalThis.__eldarinJoinTokens = new Map();
  }
  return globalThis.__eldarinJoinTokens;
}

function newTokenId(): string {
  return `jtok_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function generatePlainToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function createOneTimeJoinToken(
  adventure: Adventure,
  createdBy: string
): Promise<{ ok: true; plaintext: string; tokenId: string } | { ok: false; error: string }> {
  if (!isAdventureClosed(adventure)) {
    return { ok: false, error: "Senhas únicas só em mesas fechadas" };
  }
  if (adventure.ownerId !== createdBy) {
    return { ok: false, error: "Só o mestre pode gerar senhas" };
  }

  const plaintext = generatePlainToken();
  const tokenHash = hashPassword(plaintext);
  const id = newTokenId();
  const now = Date.now();

  const record: JoinTokenRecord = {
    id,
    adventureId: adventure.adventureId,
    tokenHash,
    createdBy,
    usedBy: null,
    usedAt: null,
    createdAt: now,
  };

  memoryStore().set(id, record);
  if (dbEnabled()) {
    await dbJoinTokens.insertJoinToken({
      id,
      adventureId: adventure.adventureId,
      tokenHash,
      createdBy,
    });
  }

  return { ok: true, plaintext, tokenId: id };
}

async function listUnusedTokens(adventureId?: string): Promise<JoinTokenRecord[]> {
  if (dbEnabled()) {
    const rows = adventureId
      ? await dbJoinTokens.listUnusedJoinTokensForAdventure(adventureId)
      : await dbJoinTokens.listAllUnusedJoinTokens();
    const fromDb = rows.map((r) => ({
      id: r.id,
      adventureId: r.adventure_id,
      tokenHash: r.token_hash,
      createdBy: r.created_by,
      usedBy: r.used_by,
      usedAt: r.used_at != null ? Number(r.used_at) : null,
      createdAt: Number(r.created_at),
    }));
    for (const t of fromDb) memoryStore().set(t.id, t);
  }

  return [...memoryStore().values()].filter(
    (t) => !t.usedBy && (!adventureId || t.adventureId === adventureId)
  );
}

export async function joinAdventureByOneTimeToken(
  adventureId: string,
  plaintext: string,
  userId: string
): Promise<Adventure | null> {
  const token = plaintext.trim();
  if (!token) return null;

  const candidates = await listUnusedTokens(adventureId);
  for (const row of candidates) {
    if (!verifyPassword(token, row.tokenHash)) continue;

    row.usedBy = userId;
    row.usedAt = Date.now();
    memoryStore().set(row.id, row);

    if (dbEnabled()) {
      await dbJoinTokens.consumeJoinToken(row.id, userId);
    }

    const { getAdventure, joinAdventureRecord } = await import("@/lib/adventure/store");
    const adv = await getAdventure(adventureId);
    if (!adv) return null;
    return joinAdventureRecord(adv, userId);
  }

  return null;
}
