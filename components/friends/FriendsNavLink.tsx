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

  return (
    <AnimatedNavLink href="/amigos" icon={<IconUser size={16} />} className="friends-nav-link nav-link">
      Amigos
    </AnimatedNavLink>
  );
}
