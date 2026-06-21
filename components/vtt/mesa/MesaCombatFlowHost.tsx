"use client";

import { useMesaMapSnapshot } from "@/hooks/vtt/useMesaRoomSlice";
import { useCombatTurnFlow } from "@/hooks/vtt/useCombatTurnFlow";

type Props = {
  roomId: string;
};

export function MesaCombatFlowHost({ roomId }: Props) {
  const mapSnapshot = useMesaMapSnapshot(roomId);
  useCombatTurnFlow({ snapshot: mapSnapshot, roomId });
  return null;
}
