"use client";

import { useEffect, useRef } from "react";
import { isStagedCombatChatMessage } from "@/lib/combat/chat-display";
import { useMesaChat } from "@/hooks/vtt/useMesaRoomSlice";

type Props = {
  roomId: string;
  onReveal: (messageIds: string[], phase: "roll" | "damage" | "done") => void;
};

/** Sincroniza fases de reveal do chat de combate — só escuta slice chat. */
export function MesaCombatChatRevealBridge({ roomId, onReveal }: Props) {
  const chat = useMesaChat(roomId);
  const seenRef = useRef<Set<string>>(new Set());
  const seededRef = useRef(false);
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  useEffect(() => {
    seededRef.current = false;
    seenRef.current = new Set();
  }, [roomId]);

  useEffect(() => {
    if (!seededRef.current) {
      seededRef.current = true;
      for (const m of chat) {
        if (isStagedCombatChatMessage(m)) seenRef.current.add(m.id);
      }
      return;
    }
    const freshIds: string[] = [];
    for (const m of chat) {
      if (!isStagedCombatChatMessage(m)) continue;
      if (!seenRef.current.has(m.id)) {
        freshIds.push(m.id);
        seenRef.current.add(m.id);
      }
    }
    if (freshIds.length) onRevealRef.current(freshIds, "roll");
  }, [chat]);

  return null;
}
