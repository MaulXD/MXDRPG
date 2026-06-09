"use client";

import { IconChat } from "@/components/ui/EldarinIcons";
import { useFriendsChat } from "@/components/friends/FriendsChatProvider";
import "./friends.css";

/** Botão na navbar — abre a janela flutuante global de mensagens. */
export function FriendsNavChat() {
  const chat = useFriendsChat();
  if (!chat?.ready || !chat.selfUserId) return null;

  return (
    <button
      type="button"
      className={`nav-link friends-nav-chat__toggle${chat.open ? " is-open" : ""}`}
      aria-expanded={chat.open}
      aria-haspopup="dialog"
      onClick={chat.toggle}
    >
      <IconChat size={16} className="friends-nav-chat__icon" />
      Mensagens
      {chat.inviteCount > 0 ? (
        <span className="friends-nav-badge__count" aria-label={`${chat.inviteCount} convites pendentes`}>
          {chat.inviteCount > 9 ? "9+" : chat.inviteCount}
        </span>
      ) : null}
    </button>
  );
}
