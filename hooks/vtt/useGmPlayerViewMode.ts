"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "eldarin-gm-player-view";

function storageKey(roomId: string): string {
  return `${STORAGE_PREFIX}-${roomId}`;
}

export function useGmPlayerViewMode(roomId: string, isActualGm: boolean) {
  const [playAsPlayer, setPlayAsPlayer] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isActualGm) {
      setPlayAsPlayer(false);
      setHydrated(true);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(roomId));
      setPlayAsPlayer(raw === "1");
    } catch {
      setPlayAsPlayer(false);
    }
    setHydrated(true);
  }, [roomId, isActualGm]);

  useEffect(() => {
    if (!hydrated || !isActualGm) return;
    try {
      localStorage.setItem(storageKey(roomId), playAsPlayer ? "1" : "0");
    } catch {
      /* quota */
    }
  }, [playAsPlayer, roomId, isActualGm, hydrated]);

  const togglePlayAsPlayer = useCallback(() => {
    if (!isActualGm) return;
    setPlayAsPlayer((prev) => !prev);
  }, [isActualGm]);

  const effectiveIsGm = isActualGm && !playAsPlayer;

  return {
    playAsPlayer,
    togglePlayAsPlayer,
    effectiveIsGm,
    hydrated,
  };
}
