"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FriendsChat } from "@/components/friends/FriendsChat";
import { friendLabel } from "@/components/friends/friend-label";
import { useFriendsChat } from "@/components/friends/FriendsChatProvider";
import { useDraggablePopup } from "@/components/friends/useDraggablePopup";
import { IconChat } from "@/components/ui/EldarinIcons";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { PortraitFocus } from "@/lib/media/portrait-focus";
import "./friends.css";

const MESSENGER_W = 360;
const MESSENGER_H = 440;

export function FriendsMessengerDock() {
  const chat = useFriendsChat();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!chat?.messengerOpen || !chat.selfUserId) return;
    void chat.refreshFriends();
  }, [chat?.messengerOpen, chat?.selfUserId, chat?.refreshFriends]);

  const onSelectFriend = useCallback(
    (friendId: string) => {
      chat?.openChat(friendId);
    },
    [chat]
  );

  if (!mounted || !chat?.selfUserId) return null;

  const { messengerOpen, messengerMinimized, openChats, activeChatId, friends, refreshUnread } = chat;

  const drag = useDraggablePopup({
    width: MESSENGER_W,
    height: MESSENGER_H,
    enabled: messengerOpen && !messengerMinimized,
  });

  const friendById = (id: string) => friends.find((f) => f.id === id) ?? null;

  const launcher =
    messengerOpen && messengerMinimized ? (
      <div className="friends-messenger-launcher" role="toolbar" aria-label="Messenger">
        <button
          type="button"
          className="friends-messenger-launcher__main"
          onClick={() => chat.restoreMessenger()}
          title="Abrir mensagens"
          aria-label="Abrir mensagens"
        >
          <IconChat size={20} />
          {chat.unreadCount > 0 ? (
            <span className="friends-messenger-launcher__badge" aria-hidden>
              {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
            </span>
          ) : null}
        </button>
        {openChats.map((id) => {
          const f = friendById(id);
          if (!f) return null;
          return (
            <button
              key={id}
              type="button"
              className={`friends-messenger-launcher__chat${activeChatId === id ? " is-active" : ""}`}
              onClick={() => {
                chat.openChat(id);
                chat.restoreMessenger();
              }}
              title={friendLabel(f)}
              aria-label={`Conversa com ${friendLabel(f)}`}
            >
              <UserAvatar
                url={f.avatarUrl}
                focus={f.avatarFocus as PortraitFocus | null}
                label={friendLabel(f)}
                className="friends-messenger-launcher__avatar"
              />
            </button>
          );
        })}
      </div>
    ) : null;

  const dock =
    messengerOpen && !messengerMinimized ? (
      <div
        ref={drag.panelRef}
        className="friends-chat-float friends-chat-float--popup"
        role="dialog"
        aria-label="Mensagens"
        style={drag.panelStyle}
        onPointerMove={drag.onDragPointerMove}
        onPointerUp={drag.onDragPointerUp}
        onPointerCancel={drag.onDragPointerUp}
      >
        <header
          className="friends-chat-float__head friends-chat-float__head--drag"
          onPointerDown={drag.onDragPointerDown}
        >
          <h2 className="friends-chat-float__title">Mensagens</h2>
          <div className="friends-chat-float__actions">
            <Link href="/amigos" className="friends-chat-float__hub" onClick={() => chat.closeMessenger()}>
              Ver amigos
            </Link>
            <button
              type="button"
              className="friends-chat-float__close"
              onClick={() => chat.minimizeMessenger()}
              aria-label="Minimizar messenger"
              title="Minimizar"
            >
              −
            </button>
            <button
              type="button"
              className="friends-chat-float__close"
              onClick={() => chat.closeMessenger()}
              aria-label="Fechar messenger"
              title="Fechar"
            >
              ×
            </button>
          </div>
        </header>

        {openChats.length > 0 ? (
          <div className="friends-messenger-tabs" role="tablist" aria-label="Conversas abertas">
            {openChats.map((id) => {
              const f = friendById(id);
              if (!f) return null;
              const label = friendLabel(f);
              return (
                <div
                  key={id}
                  className={`friends-messenger-tabs__tab${activeChatId === id ? " is-active" : ""}`}
                  role="presentation"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeChatId === id}
                    className="friends-messenger-tabs__select"
                    onClick={() => chat.setActiveChatId(id)}
                    title={label}
                  >
                    <UserAvatar
                      url={f.avatarUrl}
                      focus={f.avatarFocus as PortraitFocus | null}
                      label={label}
                      className="friends-messenger-tabs__avatar"
                    />
                    <span className="friends-messenger-tabs__name">{label}</span>
                  </button>
                  <button
                    type="button"
                    className="friends-messenger-tabs__close"
                    onClick={() => chat.closeChat(id)}
                    aria-label={`Fechar conversa com ${label}`}
                    title="Fechar conversa"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="friends-chat-float__body">
          <FriendsChat
            key={activeChatId ?? "none"}
            friends={friends}
            selfUserId={chat.selfUserId}
            variant="float"
            initialSelectedId={activeChatId}
            onSelectFriend={onSelectFriend}
            onMessagesRead={() => void refreshUnread()}
          />
        </div>
      </div>
    ) : null;

  if (!launcher && !dock) return null;

  return createPortal(
    <>
      {launcher}
      {dock}
    </>,
    document.body
  );
}
