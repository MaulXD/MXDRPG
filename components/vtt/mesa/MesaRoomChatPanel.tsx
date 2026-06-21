"use client";

import { memo } from "react";
import { RoomChat } from "@/components/vtt/RoomChat";
import type { CombatChatRevealPhase } from "@/lib/combat/chat-display";
import type { BattleToken } from "@/lib/vtt/types";
import { useMesaChat } from "@/hooks/vtt/useMesaRoomSlice";
import { useMesaSyncActions } from "@/components/vtt/MesaSyncProvider";

type Props = {
  roomId: string;
  tokens: BattleToken[];
  combatReveal: Record<string, CombatChatRevealPhase>;
  readOnly?: boolean;
};

function MesaRoomChatPanelInner({ roomId, tokens, combatReveal, readOnly }: Props) {
  const messages = useMesaChat(roomId);
  const { refresh } = useMesaSyncActions();

  return (
    <RoomChat
      roomId={roomId}
      messages={messages}
      tokens={tokens}
      combatReveal={combatReveal}
      onUpdate={refresh}
      readOnly={readOnly}
    />
  );
}

export const MesaRoomChatPanel = memo(MesaRoomChatPanelInner);
