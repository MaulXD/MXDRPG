"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/room/chat";
import { postRoomChat } from "@/hooks/useRoomSync";
import { DiceBoxMini } from "@/components/vtt/DiceBoxMini";
import { CombatChatCard } from "@/components/vtt/CombatChatCard";
import type { CombatChatRevealPhase } from "@/lib/combat/chat-display";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  roomId: string;
  messages: ChatMessage[];
  tokens?: BattleToken[];
  combatReveal?: Record<string, CombatChatRevealPhase>;
  onUpdate: () => void;
  readOnly?: boolean;
};

export function RoomChat({
  roomId,
  messages,
  tokens = [],
  combatReveal = {},
  onUpdate,
  readOnly = false,
}: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = useCallback(async () => {
    const msg = text.trim();
    if (!msg || busy) return;
    setBusy(true);
    try {
      await postRoomChat(roomId, { kind: "chat", text: msg });
      setText("");
      onUpdate();
    } finally {
      setBusy(false);
    }
  }, [text, busy, roomId, onUpdate]);

  return (
    <div className="room-chat room-chat--rail">
      <div ref={listRef} className="room-chat-log">
        {messages.map((m) => (
          <ChatEvent
            key={m.id}
            message={m}
            tokens={tokens}
            revealPhase={combatReveal[m.id]}
          />
        ))}
      </div>
      {readOnly ? (
        <p className="vtt-combat-hint" style={{ padding: "0.5rem 0", margin: 0, fontSize: "0.8rem" }}>
          Chat somente leitura (modo visitante).
        </p>
      ) : (
        <form
          className="room-chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <textarea
            rows={2}
            placeholder="Mensagem para a mesa…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
              e.preventDefault();
              void send();
            }}
            maxLength={500}
          />
          <button type="submit" className="btn" disabled={busy || !text.trim()}>
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}

function ChatEvent({
  message,
  tokens,
  revealPhase,
}: {
  message: ChatMessage;
  tokens: BattleToken[];
  revealPhase?: CombatChatRevealPhase;
}) {
  const time = new Date(message.at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (message.kind === "system") {
    return (
      <div className="room-chat-event room-chat-event--system">
        <span className="room-chat-time">{time}</span>
        <p className="room-chat-system-text">{message.text}</p>
      </div>
    );
  }

  if (message.kind === "roll" && message.roll) {
    const natural = message.roll.rolls[0] ?? message.roll.total;
    return (
      <article className="room-chat-event room-chat-event--roll">
        <div className="room-chat-event-head">
          <DiceBoxMini formula={message.roll.formula} value={natural} size="sm" />
          <div className="room-chat-event-meta">
            <span className="room-chat-time">{time}</span>
            <strong className="room-chat-author">{message.authorName}</strong>
          </div>
        </div>
        <p className="room-chat-roll-body">
          <span className="room-chat-roll-formula">{message.roll.formula}</span>
          <span className="room-chat-roll-arrow">→</span>
          <em className="room-chat-roll-total">{message.roll.total}</em>
          {message.roll.rolls.length > 1 ? (
            <span className="room-chat-roll-parts"> [{message.roll.rolls.join(", ")}]</span>
          ) : null}
        </p>
      </article>
    );
  }

  if (message.kind === "combat" && message.combat) {
    return (
      <CombatChatCard
        message={message}
        revealPhase={revealPhase}
        tokens={tokens}
        time={time}
      />
    );
  }

  return (
    <article className="room-chat-event room-chat-event--chat">
      <header className="room-chat-event-headline">
        <span className="room-chat-time">{time}</span>
        <strong className="room-chat-author">{message.authorName}</strong>
      </header>
      <p className="room-chat-chat-text">{message.text}</p>
    </article>
  );
}
