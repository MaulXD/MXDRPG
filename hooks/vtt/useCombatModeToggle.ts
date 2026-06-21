"use client";

import { useCallback, useRef, useState } from "react";
import { previewExplorationPaTokens } from "@/lib/combat/exploration-pa";
import type { RoomSnapshot } from "@/lib/room/types";
import { normalizeRoomSettings } from "@/lib/room/settings";
import { setCombatModeTogglePending } from "@/lib/vtt/combat-mode-pending";
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
  const inFlightRef = useRef(false);

  const setCombatMode = useCallback(
    async (active: boolean) => {
      if (!snapshot || busy || inFlightRef.current) return;
      const current = normalizeRoomSettings(snapshot.settings).combatActive;
      if (current === active) return;

      inFlightRef.current = true;
      setBusy(true);
      revertRef.current = snapshot;
      setCombatModeTogglePending(roomId, active);

      const settings = normalizeRoomSettings({ ...snapshot.settings, combatActive: active });
      const optimistic: RoomSnapshot = {
        ...snapshot,
        settings,
        combat: active
          ? snapshot.combat
          : { ...snapshot.combat, pendingAutoPass: undefined },
        scene: active
          ? snapshot.scene
          : {
              ...snapshot.scene,
              tokens: previewExplorationPaTokens(snapshot.scene.tokens, snapshot.actors),
            },
      };
      applyUpdate(optimistic, { force: true, immediate: true });

      try {
        const payload = await postGmCombatAction(roomId, {
          action: "set-combat-mode",
          active,
        });
        applyUpdate(payload, { force: true, immediate: true });
        revertRef.current = null;
      } catch (e) {
        const prev = revertRef.current;
        if (prev) applyUpdate(prev, { force: true, immediate: true });
        revertRef.current = null;
        throw e;
      } finally {
        setCombatModeTogglePending(roomId, null);
        inFlightRef.current = false;
        setBusy(false);
      }
    },
    [roomId, snapshot, busy, applyUpdate]
  );

  return { setCombatMode, busy };
}
