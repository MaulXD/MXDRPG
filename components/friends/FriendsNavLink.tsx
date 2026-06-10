"use client";

import { AnimatedNavLink } from "@/components/AnimatedNavLink";
import { IconUser } from "@/components/ui/EldarinIcons";
import { useFriendsChat } from "@/components/friends/FriendsChatProvider";
import "./friends.css";

/** Link na navbar → página /amigos (com badge de pendências). */
export function FriendsNavLink() {
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

  return (
    <AnimatedNavLink href="/amigos" icon={<IconUser size={16} />} className="friends-nav-link nav-link">
      <span className="friends-nav-link__wrap">
        Amigos
        {badge > 0 ? (
          <span className="friends-nav-chat__badge friends-nav-link__badge" aria-label={badgeLabel}>
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </span>
    </AnimatedNavLink>
  );
}
