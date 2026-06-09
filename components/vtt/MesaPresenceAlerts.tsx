"use client";

import { useEffect, type MutableRefObject } from "react";
import { useVttToast } from "@/components/vtt/VttToast";
import type { RoomMemberOnlineEvent } from "@/hooks/useRoomSync";

type Props = {
  bridgeRef: MutableRefObject<((event: RoomMemberOnlineEvent) => void) | null>;
  selfUserId?: string | null;
};

/** Toasts quando outro jogador entra online na mesa. */
export function MesaPresenceAlerts({ bridgeRef, selfUserId }: Props) {
  const toast = useVttToast();

  useEffect(() => {
    bridgeRef.current = ({ userId, displayName }) => {
      if (selfUserId && userId === selfUserId) return;
      toast.push(`${displayName} entrou na mesa`, "success");
    };
    return () => {
      bridgeRef.current = null;
    };
  }, [bridgeRef, selfUserId, toast]);

  return null;
}
