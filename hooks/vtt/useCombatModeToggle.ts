"use client";

import { useCallback, useRef, useState } from "react";
import type { RoomSnapshot } from "@/lib/room/types";
import { normalizeRoomSettings } from "@/lib/room/settings";
import { postGmCombatAction, type RoomApiPayload } from "@/hooks/useRoomSync";

type ApplyFn = (
  payload: RoomApiPayload,
  opts?: { force?: boolean; immediate?: boolean }
) => void;

/** Alterna modo combate/aventura com preview imediato + POST em background. */
export function useCombatModeToggle(
  roomId: string,
  snapshot: RoomSnapshot | null | undefined,
  applyUpdate: ApplyFn
) {
  const [busy, setBusy] = useState(false);
  const revertRef = useRef<RoomSnapshot | null>(null);

  const setCombatMode = useCallback(
    async (active: boolean) => {
      if (!snapshot || busy) return;
      const current = normalizeRoomSettings(snapshot.settings).combatActive;
      if (current === active) return;

      setBusy(true);
      revertRef.current = snapshot;

      const optimistic: RoomSnapshot = {
        ...snapshot,
        settings: normalizeRoomSettings({ ...snapshot.settings, combatActive: active }),
      };
      applyUpdate(optimistic, { force: true, immediate: true });

      try {
        const payload = await postGmCombatAction(roomId, {
          action: "set-combat-mode",
          active,
        });
        applyUpdate(payload, { force: true, immediate: false });
        revertRef.current = null;
      } catch (e) {
        const prev = revertRef.current;
        if (prev) applyUpdate(prev, { force: true, immediate: false });
        revertRef.current = null;
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [roomId, snapshot, busy, applyUpdate]
  );

  return { setCombatMode, busy };
}
