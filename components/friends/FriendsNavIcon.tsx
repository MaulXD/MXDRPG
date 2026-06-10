"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconUser } from "@/components/ui/EldarinIcons";
import { useFriendsChat } from "@/components/friends/FriendsChatProvider";
import "./friends.css";

/** Ícone compacto na navbar → página /amigos (badge de convites + pedidos). */
export function FriendsNavIcon() {
  const pathname = usePathname();
  const chat = useFriendsChat();
  if (!chat) return null;
  if (chat.ready && !chat.selfUserId) return null;

  const pending = chat.inviteCount + chat.requestCount;
  const badgeLabel =
    pending > 0
      ? `${pending} pendência${pending === 1 ? "" : "s"} de amizade`
      : "";

  return (
    <Link
      href="/amigos"
      className={`friends-nav-icon friends-nav-messages__trigger${pathname === "/amigos" ? " is-active" : ""}`}
      aria-label={badgeLabel ? `Amigos, ${badgeLabel}` : "Amigos"}
      title="Amigos"
    >
      <IconUser size={18} />
      {pending > 0 ? (
        <span className="friends-nav-messages__badge" aria-hidden>
          {pending > 9 ? "9+" : pending}
        </span>
      ) : null}
    </Link>
  );
}
