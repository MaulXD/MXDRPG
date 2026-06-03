"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/room/chat";
import { postRoomChat } from "@/hooks/useRoomSync";

type Props = {
  roomId: string;
  messages: ChatMessage[];
  onUpdate: () => void;
};

export function RoomChat({ roomId, messages, onUpdate }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send() {
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
  }

  return (
    <div className="room-chat">
      <div className="room-chat-head">
        <p className="vtt-eyebrow" style={{ margin: 0 }}>
          Registro da sessão
        </p>
      </div>
      <div ref={listRef} className="room-chat-log">
        {messages.map((m) => (
          <ChatLine key={m.id} message={m} />
        ))}
      </div>
      <form
        className="room-chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          type="text"
          placeholder="Mensagem para a mesa…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
        />
        <button type="submit" className="btn" disabled={busy || !text.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}

function ChatLine({ message }: { message: ChatMessage }) {
  const time = new Date(message.at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (message.kind === "system") {
    return (
      <p className="room-chat-system">
        <span>{time}</span> {message.text}
      </p>
    );
  }

  const isRoll = message.kind === "roll";
  const isCombat = message.kind === "combat";

  return (
    <div className={`room-chat-line ${isRoll ? "roll" : ""} ${isCombat ? "combat" : ""}`}>
      <span className="room-chat-time">{time}</span>
      <strong>{message.authorName}</strong>
      {isCombat && message.combat ? (
        <span className="room-chat-combat">
          ⚔ {message.text}
          <small> {message.combat.detail}</small>
        </span>
      ) : isRoll ? (
        <span className="room-chat-roll">
          🎲 {message.roll?.formula} → <em>{message.roll?.total}</em>
          {message.roll && message.roll.rolls.length > 1 ? (
            <small> [{message.roll.rolls.join(", ")}]</small>
          ) : null}
        </span>
      ) : (
        <span>{message.text}</span>
      )}
    </div>
  );
}
