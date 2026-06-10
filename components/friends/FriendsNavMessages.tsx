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
      className={`friends-nav-messages friends-nav-messages__trigger${chat.messengerOpen && !chat.messengerMinimized ? " is-open" : ""}`}
      onClick={() => chat.toggleMessenger()}
      aria-pressed={chat.messengerOpen && !chat.messengerMinimized}
      aria-label={badgeLabel ? `Mensagens, ${badgeLabel}` : "Mensagens"}
      title="Mensagens"
    >
      <IconChat size={18} />
      {unread > 0 ? (
        <span className="friends-nav-messages__badge" aria-hidden>
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </button>
  );
}
