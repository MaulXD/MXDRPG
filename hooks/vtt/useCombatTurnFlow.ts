"use client";

import { useEffect, useRef } from "react";
import { activeTokenId } from "@/lib/room/combat";
import type { RoomSnapshot } from "@/lib/room/types";
import { useVttToast } from "@/components/vtt/VttToast";
import { nextCombatTurn } from "@/hooks/useRoomSync";

type Props = {
  snapshot: RoomSnapshot | null;
  roomId: string;
  onSnapshot?: (snap: RoomSnapshot) => void;
};

/** Toasts de turno/PA e auto-passe quando o ativo esgota PA. */
export function useCombatTurnFlow({ snapshot, roomId, onSnapshot }: Props) {
  const toast = useVttToast();
  const prevRevision = useRef<number | null>(null);
  const prevNoticesKey = useRef<string>("");
  const autoPassKeyRef = useRef<string | null>(null);

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
    if (!pending || !roomId) return;

    const key = `${pending.tokenId}:${pending.passAt}`;
    if (autoPassKeyRef.current === key) return;
    autoPassKeyRef.current = key;

    const delay = Math.max(0, pending.passAt - Date.now());
    const timer = setTimeout(() => {
      void nextCombatTurn(roomId, { force: true })
        .then((snap) => {
          onSnapshot?.(snap);
        })
        .catch(() => {
          /* outro cliente ou poll do servidor pode ter avançado */
        });
    }, delay);

    return () => clearTimeout(timer);
  }, [
    snapshot?.combat?.pendingAutoPass?.tokenId,
    snapshot?.combat?.pendingAutoPass?.passAt,
    roomId,
    onSnapshot,
  ]);
}
