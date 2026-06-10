"use client";

import { useEffect, useRef } from "react";
import {
  clearSheetPdfDeepLinkFromUrl,
  handleSheetPdfDeepLink,
  readSheetPdfDeepLinkFromLocation,
  type SheetPdfDeepLinkContext,
} from "@/lib/character/sheet-pdf-deep-link";

type Props = SheetPdfDeepLinkContext & {
  openSheet: (characterId: string) => void;
  onRolled?: () => void;
  enabled?: boolean;
};

/** Processa ?sheetPdf=1 na URL (abrir ficha e rolar perícia se for o turno). */
export function useSheetPdfDeepLink({
  roomId,
  combat,
  tokens,
  actors,
  bypassTurn,
  openSheet,
  onRolled,
  enabled = true,
}: Props) {
  const ctxRef = useRef({
    roomId,
    combat,
    tokens,
    actors,
    bypassTurn,
    openSheet,
    onRolled,
  });
  ctxRef.current = { roomId, combat, tokens, actors, bypassTurn, openSheet, onRolled };
  const processedRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const params = readSheetPdfDeepLinkFromLocation();
    if (!params || processedRef.current) return;

    const needsRollContext =
      params.action === "roll" && params.skill && roomId;
    if (needsRollContext) {
      const actor = actors?.[params.characterId];
      const token = tokens?.find((t) => t.linked && t.actorId === params.characterId);
      if (!actor || !token) return;
    }

    processedRef.current = true;

    void (async () => {
      try {
        const ctx = ctxRef.current;
        await handleSheetPdfDeepLink(
          params,
          {
            roomId: ctx.roomId,
            combat: ctx.combat,
            tokens: ctx.tokens,
            actors: ctx.actors,
            bypassTurn: ctx.bypassTurn,
          },
          { openSheet: ctx.openSheet, onRolled: ctx.onRolled }
        );
      } finally {
        clearSheetPdfDeepLinkFromUrl();
      }
    })();
  }, [enabled, roomId, actors, tokens, combat]);
}
