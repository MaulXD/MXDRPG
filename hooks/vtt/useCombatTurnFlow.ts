"use client";

import { useEffect, useRef } from "react";
import { activeTokenId } from "@/lib/room/combat";
import { tokenSpendablePa } from "@/lib/combat/pa-turn";
import { hasCondition } from "@/lib/combat/conditions";
import type { RoomSnapshot } from "@/lib/room/types";
import type { SessionUser } from "@/lib/auth/types";
import {
  canAdvanceCombatTurn,
  type CombatTurnAccessOpts,
} from "@/lib/auth/combat-turn-access";
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
  combatAccessOpts?: CombatTurnAccessOpts;
  onSnapshot: (snap: RoomSnapshot) => void;
  onRefresh: () => void;
};

/** Toasts de turno/PA e auto-passe quando PA zera (backup client-side). */
export function useCombatTurnFlow({
  roomId,
  roomCtx,
  snapshot,
  session,
  canEndTurn,
  combatAccessOpts,
  onSnapshot,
  onRefresh,
}: Props) {
  const toast = useVttToast();
  const prevRevision = useRef<number | null>(null);
  const prevNoticesKey = useRef<string>("");
  const paZeroKey = useRef<string | null>(null);
  const autoPassBusy = useRef(false);
  const timerRef = useRef<number | null>(null);
  const trackedActiveKey = useRef<string | null>(null);

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

    if (!canAdvanceCombatTurn(turnRoom, session, combat, combatAccessOpts)) return;
    if (hasCondition(token, "atordoado")) return;

    const spendable = tokenSpendablePa(token);
    const activeKey = `${combat.round}-${activeId}`;

    if (spendable > 0) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      paZeroKey.current = null;
      autoPassBusy.current = false;
      trackedActiveKey.current = activeKey;
      return;
    }

    if (trackedActiveKey.current !== null && trackedActiveKey.current !== activeKey) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      paZeroKey.current = null;
      autoPassBusy.current = false;
    }
    trackedActiveKey.current = activeKey;

    if (paZeroKey.current === activeKey || autoPassBusy.current) return;

    const serverAutoPassed = (combat.notices ?? []).some(
      (n) => n.includes("passou automaticamente") && n.includes(token.name)
    );
    if (serverAutoPassed) {
      paZeroKey.current = activeKey;
      return;
    }

    paZeroKey.current = activeKey;

    toast.push("PA esgotados — o turno será passado.", "warn");

    autoPassBusy.current = true;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
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
  }, [
    snapshot,
    canEndTurn,
    roomId,
    roomCtx,
    session,
    combatAccessOpts,
    toast,
    onSnapshot,
    onRefresh,
  ]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);
}
