"use client";

import { useEffect, useRef } from "react";
import { activeTokenId } from "@/lib/room/combat";
import type { RoomSnapshot } from "@/lib/room/types";
import { nextCombatTurn } from "@/hooks/useRoomSync";
import { useVttToast } from "@/components/vtt/VttToast";

type Props = {
  snapshot: RoomSnapshot | null;
  roomId?: string;
  /** Mestre ou jogador na vez — dispara auto-passe após o delay do servidor. */
  canAutoPass?: boolean;
  onSnapshot?: (snap: RoomSnapshot) => void;
};

/** Toasts de turno/PA + auto-passe após PA zerado (delay 1,5s no servidor). */
export function useCombatTurnFlow({
  snapshot,
  roomId,
  canAutoPass = false,
  onSnapshot,
}: Props) {
  const toast = useVttToast();
  const prevRevision = useRef<number | null>(null);
  const prevNoticesKey = useRef<string>("");
  const autoPassKey = useRef<string | null>(null);

  useEffect(() => {
    if (!snapshot?.combat) return;

    const notices = snapshot.combat.notices ?? [];
    const activeId = activeTokenId(snapshot.combat);
    const noticesKey = `${snapshot.combat.round}:${snapshot.combat.activeIndex}:${activeId ?? ""}:${notices.join("|")}`;
    if (noticesKey !== prevNoticesKey.current && notices.length > 0) {
      prevNoticesKey.current = noticesKey;
      for (const n of notices) {
        const variant =
          n.includes("atordoado") || n.includes("perdido") || n.includes("perdidos")
            ? "warn"
            : n.includes("expirou")
              ? "info"
              : "info";
        toast.push(n, variant);
      }
    }

    if (prevRevision.current === snapshot.revision) return;
    prevRevision.current = snapshot.revision;
  }, [snapshot, toast]);

  useEffect(() => {
    const pending = snapshot?.combat?.pendingAutoPass;
    if (!pending || !roomId || !canAutoPass) {
      autoPassKey.current = null;
      return;
    }

    const key = `${pending.tokenId}:${pending.passAt}`;
    if (autoPassKey.current === key) return;
    autoPassKey.current = key;

    const delay = Math.max(0, pending.passAt - Date.now());
    const timer = setTimeout(() => {
      void nextCombatTurn(roomId)
        .then((snap) => onSnapshot?.(snap))
        .catch(() => {
          autoPassKey.current = null;
        });
    }, delay);

    return () => clearTimeout(timer);
  }, [snapshot?.combat?.pendingAutoPass, roomId, canAutoPass, onSnapshot]);
}
