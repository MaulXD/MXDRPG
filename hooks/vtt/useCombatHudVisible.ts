"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "eldarin-combat-hud-visible";

export function useCombatHudVisible(roomId?: string) {
  const key = `${STORAGE_KEY}${roomId ? `-${roomId}` : ""}`;
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === "0") setVisible(false);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [key]);

  const setHudVisible = useCallback(
    (next: boolean) => {
      setVisible(next);
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {
        /* ignore */
      }
    },
    [key]
  );

  const toggle = useCallback(() => setHudVisible(!visible), [setHudVisible, visible]);

  return { visible, ready, setHudVisible, toggle };
}
