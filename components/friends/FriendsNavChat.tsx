"use client";

import { IconChat } from "@/components/ui/EldarinIcons";
import { useFriendsChat } from "@/components/friends/FriendsChatProvider";
import "./friends.css";

/** Botão na navbar — abre a janela flutuante global de mensagens. */
export function FriendsNavChat() {
  const chat = useFriendsChat();
  if (!chat) return null;
  if (chat.ready && !chat.selfUserId) return null;

  const messageBadge = chat.unreadCount > 0 ? chat.unreadCount : 0;
  const requestBadge = chat.requestCount > 0 ? chat.requestCount : 0;
  const inviteBadge = chat.inviteCount > 0 ? chat.inviteCount : 0;
  const badge =
    messageBadge > 0 ? messageBadge : requestBadge > 0 ? requestBadge : inviteBadge;
  const badgeLabel =
    messageBadge > 0
      ? `${messageBadge} mensagem${messageBadge === 1 ? "" : "s"} não lida${messageBadge === 1 ? "" : "s"}`
      : requestBadge > 0
        ? `${requestBadge} pedido${requestBadge === 1 ? "" : "s"} de amizade`
        : inviteBadge > 0
          ? `${inviteBadge} convite${inviteBadge === 1 ? "" : "s"} de mesa`
          : "";

  const pending = !chat.ready;

  return (
    <button
      type="button"
      className={`nav-link friends-nav-chat__toggle${chat.open ? " is-open" : ""}${pending ? " is-pending" : ""}`}
      aria-expanded={chat.open}
      aria-haspopup="dialog"
      aria-busy={pending}
      disabled={pending}
      onClick={chat.toggle}
    >
      <span className="friends-nav-chat__icon-wrap">
        <IconChat size={16} className="friends-nav-chat__icon" />
        {badge > 0 ? (
          <span className="friends-nav-chat__badge" aria-label={badgeLabel}>
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </span>
      <span className="nav-link__label">Mensagens</span>
    </button>
  );
}
