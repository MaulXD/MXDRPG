"use client";

import { useMemo } from "react";
import type { CharacterSheet } from "@/lib/character/types";
import {
  DEFAULT_PORTRAIT_FOCUS,
  resolveTokenFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
import type { BattleToken } from "@/lib/vtt/types";

export function usePortraitFocusByToken(
  tokens: BattleToken[],
  actors: Record<string, CharacterSheet> | undefined
) {
  return useMemo(() => {
    const map = new Map<string, PortraitFocus>();
    for (const token of tokens) {
      if (token.imageFocus) {
        map.set(token.id, token.imageFocus);
        continue;
      }
      if (token.actorId && actors?.[token.actorId]) {
        map.set(
          token.id,
          resolveTokenFocus(actors[token.actorId]) ?? DEFAULT_PORTRAIT_FOCUS
        );
      }
    }
    return map;
  }, [tokens, actors]);
}
