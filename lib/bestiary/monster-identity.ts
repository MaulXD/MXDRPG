import type { BattleToken } from "@/lib/vtt/types";

/** Chave estável para agrupar o mesmo tipo de monstro no bestiário. */
export function monsterTypeKey(token: Pick<BattleToken, "id" | "monsterEntryId" | "gmCreationId">): string {
  if (token.monsterEntryId) return `entry:${token.monsterEntryId}`;
  if (token.gmCreationId) return `gm:${token.gmCreationId}`;
  return `token:${token.id}`;
}

export function parseMonsterTypeKey(typeKey: string): {
  monsterEntryId?: string;
  gmCreationId?: string;
} {
  if (typeKey.startsWith("entry:")) return { monsterEntryId: typeKey.slice(6) };
  if (typeKey.startsWith("gm:")) return { gmCreationId: typeKey.slice(3) };
  return {};
}

export function tokensMatchingTypeKey(tokens: BattleToken[], typeKey: string): BattleToken[] {
  return tokens.filter((t) => monsterTypeKey(t) === typeKey);
}
