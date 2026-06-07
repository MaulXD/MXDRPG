import type { CharacterSheet } from "@/lib/character/types";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";
import type { RoomActor } from "./types";

export function firstPortraitDataUrl(
  ...candidates: (string | null | undefined)[]
): string | null {
  for (const url of candidates) {
    if (typeof url === "string" && url.length > 0) return url;
  }
  return null;
}

export function resolveLinkedTokenImageUrl(
  token: BattleToken,
  actor: CharacterSheet | RoomActor
): string | null {
  return firstPortraitDataUrl(actor.tokenImageUrl, actor.portraitUrl, token.imageUrl);
}

export function mergeTokenPortraitFields(
  local: BattleToken,
  remote: BattleToken
): Pick<BattleToken, "imageUrl" | "imageFocus"> {
  return {
    imageUrl: firstPortraitDataUrl(remote.imageUrl, local.imageUrl),
    imageFocus: remote.imageFocus ?? local.imageFocus,
  };
}

/** Evita perder retrato quando o snapshot parcial não traz imageUrl (ex.: passar turno). */
export function mergeScenePreservingPortraits(
  prev: BattleScene,
  next: BattleScene
): BattleScene {
  return {
    ...next,
    tokens: next.tokens.map((remote) => {
      const local = prev.tokens.find((t) => t.id === remote.id);
      if (!local) return remote;
      const portrait = mergeTokenPortraitFields(local, remote);
      if (
        portrait.imageUrl === remote.imageUrl &&
        portrait.imageFocus === remote.imageFocus
      ) {
        return remote;
      }
      return { ...remote, ...portrait };
    }),
  };
}

/** Copia imageUrl do token para a ficha quando só o mapa tinha a imagem. */
export function backfillActorPortraitsFromTokens(
  actors: Record<string, RoomActor>,
  tokens: BattleToken[]
): { actors: Record<string, RoomActor>; changed: boolean } {
  const next = { ...actors };
  let changed = false;

  for (const token of tokens) {
    if (!token.linked || !token.actorId) continue;
    const imageUrl = firstPortraitDataUrl(token.imageUrl);
    if (!imageUrl) continue;

    const actor = next[token.actorId];
    if (!actor) continue;

    if (firstPortraitDataUrl(actor.tokenImageUrl, actor.portraitUrl)) continue;

    next[token.actorId] = {
      ...actor,
      tokenImageUrl: imageUrl,
      revision: actor.revision + 1,
    };
    changed = true;
  }

  return { actors: next, changed };
}
