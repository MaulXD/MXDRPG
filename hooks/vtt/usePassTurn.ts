"use client";

import { useCallback, useRef, useState } from "react";
import type { RoomSnapshot } from "@/lib/room/types";
import { previewPassTurn } from "@/lib/room/preview-next-turn";
import { nextCombatTurn, type RoomApiPayload } from "@/hooks/useRoomSync";

type ApplyFn = (
  payload: RoomApiPayload,
  opts?: { force?: boolean; immediate?: boolean }
) => void;

/** Passa turno com preview imediato + POST em background. */
export function usePassTurn(
  roomId: string,
  snapshot: RoomSnapshot | null | undefined,
  applyUpdate: ApplyFn
) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const revertRef = useRef<RoomSnapshot | null>(null);
  const inFlightRef = useRef(false);

  const passTurn = useCallback(async () => {
    if (!snapshot?.combat?.order?.length || inFlightRef.current) return;
    inFlightRef.current = true;
    setErr(null);
    revertRef.current = snapshot;

    const preview = previewPassTurn(
      snapshot.combat,
      snapshot.scene.tokens,
      snapshot.actors
    );
    const optimistic: RoomSnapshot = {
      ...snapshot,
      combat: preview.combat,
      scene: { ...snapshot.scene, tokens: preview.tokens },
    };
    applyUpdate(optimistic, { force: true, immediate: true });
    setBusy(false);

    try {
      const payload = await nextCombatTurn(roomId, { force: true });
      applyUpdate(payload, { force: true, immediate: true });
      revertRef.current = null;
    } catch (e) {
      const prev = revertRef.current;
      if (prev) applyUpdate(prev, { force: true, immediate: true });
      revertRef.current = null;
      const message = e instanceof Error ? e.message : "Não foi possível passar o turno";
      setErr(message);
      throw e;
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  }, [roomId, snapshot, applyUpdate]);

  return { passTurn, busy, err, clearErr: () => setErr(null) };
}
