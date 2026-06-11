"use client";

import { useEffect, useRef } from "react";
import { activeTokenId } from "@/lib/room/combat";
import type { RoomSnapshot } from "@/lib/room/types";
import { useVttToast } from "@/components/vtt/VttToast";

type Props = {
  snapshot: RoomSnapshot | null;
};

/** Toasts de turno/PA vindos do servidor (auto-passe é só no servidor). */
export function useCombatTurnFlow({ snapshot }: Props) {
  const toast = useVttToast();
  const prevRevision = useRef<number | null>(null);
  const prevNoticesKey = useRef<string>("");

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
}
