"use client";

import { IconChat } from "@/components/ui/EldarinIcons";
import { useFriendsChat } from "@/components/friends/FriendsChatProvider";
import "./friends.css";

/** Botão na navbar que abre/fecha o messenger flutuante (badge só de mensagens não lidas). */
export function FriendsNavMessages() {
  const chat = useFriendsChat();
  if (!chat) return null;
  if (chat.ready && !chat.selfUserId) return null;

  const unread = chat.unreadCount > 0 ? chat.unreadCount : 0;
  const badgeLabel =
    unread > 0
      ? `${unread} mensagem${unread === 1 ? "" : "s"} não lida${unread === 1 ? "" : "s"}`
      : "";

  return (
    <button
      type="button"
      className={`friends-nav-messages nav-link${chat.messengerOpen && !chat.messengerMinimized ? " nav-link--active" : ""}`}
      onClick={() => chat.toggleMessenger()}
      aria-pressed={chat.messengerOpen && !chat.messengerMinimized}
      title="Mensagens"
    >
      <IconChat size={16} className="nav-link__icon" />
      <span className="friends-nav-link__wrap nav-link__label">
        Mensagens
        {unread > 0 ? (
          <span className="friends-nav-chat__badge friends-nav-link__badge" aria-label={badgeLabel}>
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </span>
    </button>
  );
}
