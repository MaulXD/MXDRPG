"use client";

import { useEffect, useRef } from "react";
import { activeTokenId } from "@/lib/room/combat";
import { tokenSpendablePa } from "@/lib/combat/pa-turn";
import { hasCondition } from "@/lib/combat/conditions";
import type { RoomSnapshot } from "@/lib/room/types";
import type { SessionUser } from "@/lib/auth/types";
import { canAdvanceCombatTurn } from "@/lib/auth/combat-turn-access";
import { canManageRoom } from "@/lib/auth/room-access";
import { nextCombatTurn } from "@/hooks/useRoomSync";
import { useVttToast } from "@/components/vtt/VttToast";

type RoomCtx = {
  roomId: string;
  ownerId: string;
  memberIds: string[];
};

type Props = {
  roomId: string;
  roomCtx: RoomCtx;
  snapshot: RoomSnapshot | null;
  session: SessionUser | null;
  canEndTurn: boolean;
  onSnapshot: (snap: RoomSnapshot) => void;
  onRefresh: () => void;
};

/** Toasts de turno/PA e auto-passe quando PA zera. */
export function useCombatTurnFlow({
  roomId,
  roomCtx,
  snapshot,
  session,
  canEndTurn,
  onSnapshot,
  onRefresh,
}: Props) {
  const toast = useVttToast();
  const prevRevision = useRef<number | null>(null);
  const prevNoticesKey = useRef<string>("");
  const paZeroKey = useRef<string | null>(null);
  const autoPassBusy = useRef(false);

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
    if (!snapshot?.combat || !canEndTurn) return;

    const combat = snapshot.combat;
    const activeId = activeTokenId(combat);
    if (!activeId) return;

    const token = snapshot.scene.tokens.find((t) => t.id === activeId);
    if (!token) return;

    const turnRoom = {
      roomId,
      ownerId: roomCtx.ownerId,
      memberIds: roomCtx.memberIds,
      scene: snapshot.scene,
      actors: snapshot.actors,
    };

    if (!canAdvanceCombatTurn(turnRoom, session, combat)) return;
    if (canManageRoom(turnRoom, session)) return;
    if (hasCondition(token, "atordoado")) return;

    const spendable = tokenSpendablePa(token);
    if (spendable > 0) {
      paZeroKey.current = null;
      return;
    }

    const key = `${combat.round}-${activeId}-${snapshot.revision}`;
    if (paZeroKey.current === key || autoPassBusy.current) return;
    paZeroKey.current = key;

    toast.push("PA esgotados — o turno será passado.", "warn");

    autoPassBusy.current = true;
    const timer = window.setTimeout(() => {
      void nextCombatTurn(roomId)
        .then((snap) => {
          onSnapshot(snap);
          onRefresh();
        })
        .catch((e) => {
          toast.push(
            e instanceof Error ? e.message : "Não foi possível passar o turno",
            "warn"
          );
        })
        .finally(() => {
          autoPassBusy.current = false;
        });
    }, 1400);

    return () => {
      window.clearTimeout(timer);
      autoPassBusy.current = false;
    };
  }, [snapshot, canEndTurn, roomId, roomCtx, session, toast, onSnapshot, onRefresh]);
}
