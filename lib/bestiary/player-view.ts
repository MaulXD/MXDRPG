import type {
  PlayerBestiaryEntry,
  PlayerBestiaryGmView,
  PlayerMonsterKnowledgeView,
} from "@/lib/bestiary/types";

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

export function buildPlayerBestiaryEntryViews(
  entries: PlayerBestiaryEntry[]
): PlayerMonsterKnowledgeView[] {
  return entries
    .map((entry) =>
      buildPlayerMonsterKnowledgeView(entry, entry.displayName, entry.typeKey)
    )
    .filter((v) => v.hasAnyKnowledge)
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"));
}

export function buildPlayerBestiaryGmView(opts: {
  playerUserId: string;
  playerName: string;
  characterName: string;
  entries: PlayerBestiaryEntry[];
}): PlayerBestiaryGmView {
  const views = buildPlayerBestiaryEntryViews(opts.entries);

  return {
    playerUserId: opts.playerUserId,
    playerName: opts.playerName,
    characterName: opts.characterName,
    entries: views,
  };
}
