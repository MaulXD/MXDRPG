"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/room/chat";
import {
  combatEventIcon,
  combatEventTone,
  parsePrimaryDie,
} from "@/lib/room/chat-events";
import { postRoomChat } from "@/hooks/useRoomSync";
import { DiceMiniature } from "@/components/vtt/DiceMiniature";

type Props = {
  roomId: string;
  messages: ChatMessage[];
  onUpdate: () => void;
  readOnly?: boolean;
};

export function RoomChat({ roomId, messages, onUpdate, readOnly = false }: Props) {
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
    <div className="room-chat room-chat--rail">
      <div ref={listRef} className="room-chat-log">
        {messages.map((m) => (
          <ChatEvent key={m.id} message={m} />
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
      )}
    </div>
  );
}

function ChatEvent({ message }: { message: ChatMessage }) {
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
    const sides = parsePrimaryDie(message.roll.formula);
    return (
      <article className="room-chat-event room-chat-event--roll">
        <div className="room-chat-event-head">
          <DiceMiniature formula={message.roll.formula} value={natural} size="sm" />
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
        <span className="room-chat-roll-die-hint">d{sides}</span>
      </article>
    );
  }

  if (message.kind === "combat" && message.combat) {
    const tone = combatEventTone(message.combat);
    const icon = combatEventIcon(tone);
    const c = message.combat;
    const hpMax = Math.max(c.defenderHpBefore, c.defenderHpAfter, 1);
    const hpPct = Math.round((c.defenderHpAfter / hpMax) * 100);
    const showHpBar =
      tone !== "defeat" &&
      tone !== "info" &&
      c.defenderHpBefore > 0 &&
      (c.hit || c.resolution === "save");

    return (
      <article className={`room-chat-event room-chat-event--combat room-chat-event--${tone}`}>
        <div className="room-chat-event-icon" aria-hidden>
          {icon}
        </div>
        <div className="room-chat-event-body">
          <header className="room-chat-event-headline">
            <span className="room-chat-time">{time}</span>
            {tone !== "defeat" ? (
              <span className="room-chat-author">{message.authorName}</span>
            ) : null}
          </header>
          <p className="room-chat-combat-summary">{message.text}</p>
          {c.attackerHeal && c.attackerHeal > 0 ? (
            <p className="room-chat-combat-heal">+{c.attackerHeal} HP (arma)</p>
          ) : null}
          {showHpBar ? (
            <div className="room-chat-hp-bar" role="presentation">
              <div
                className="room-chat-hp-bar-fill"
                style={{ width: `${Math.min(100, hpPct)}%` }}
              />
              <span className="room-chat-hp-bar-label">
                HP {c.defenderHpBefore}→{c.defenderHpAfter}
              </span>
            </div>
          ) : null}
          {c.detail ? <p className="room-chat-combat-detail">{c.detail}</p> : null}
        </div>
      </article>
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
