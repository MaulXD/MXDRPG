import type { PlayerBestiaryEntry, PlayerMonsterKnowledgeView } from "@/lib/bestiary/types";

/** Monta o que o jogador pode ver — nunca expõe HP atual do monstro. */
export function buildPlayerMonsterKnowledgeView(
  entry: PlayerBestiaryEntry | null,
  displayName: string,
  typeKey: string
): PlayerMonsterKnowledgeView {
  const attacks = entry?.attacksAgainstPlayer ?? [];
  const damageDealt = entry?.damageDealtByPlayer ?? 0;
  const killCount = entry?.killCount ?? 0;
  const hpMaxKnown = killCount > 0 && entry?.hpMaxKnown != null ? entry.hpMaxKnown : null;

  return {
    displayName: entry?.displayName || displayName,
    typeKey,
    attacksAgainstPlayer: [...attacks].sort((a, b) => a.at - b.at),
    damageDealtByPlayer: damageDealt,
    killCount,
    hpMaxKnown,
    hasAnyKnowledge: attacks.length > 0 || damageDealt > 0 || killCount > 0,
  };
}
