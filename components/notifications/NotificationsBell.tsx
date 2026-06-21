"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFriendsChat } from "@/components/friends/FriendsChatProvider";
import { IconBell } from "@/components/ui/EldarinIcons";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useNotifications } from "@/components/notifications/NotificationsProvider";
import type { NotificationItem } from "@/lib/notifications/types";

const fetchOpts = { credentials: "same-origin" as const };

export function NotificationsBell() {
  const notif = useNotifications();
  const friendsChat = useFriendsChat();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPanelPos({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    const timer = window.setTimeout(() => {
      document.addEventListener("click", onDocClick, true);
    }, 0);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleOpen = useCallback(() => {
    setOpen((wasOpen) => {
      if (wasOpen) return false;
      updatePanelPosition();
      return true;
    });
  }, [updatePanelPosition]);

  if (!notif || !notif.ready || !notif.selfUserId) return null;

  async function acceptFriend(requestId: string) {
    setBusyId(requestId);
    try {
      const res = await fetch(`/api/friends/requests/${requestId}/accept`, {
        method: "POST",
        ...fetchOpts,
      });
      if (!res.ok) return;
      await notif?.refresh();
      void friendsChat?.refreshFriends();
    } finally {
      setBusyId(null);
    }
  }

  async function rejectFriend(requestId: string) {
    setBusyId(requestId);
    try {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: "DELETE",
        ...fetchOpts,
      });
      if (!res.ok) return;
      await notif?.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function dismissInvite(inviteId: string) {
    setBusyId(inviteId);
    try {
      const res = await fetch(`/api/friends/invites/${inviteId}`, {
        method: "DELETE",
        ...fetchOpts,
      });
      if (!res.ok) return;
      await notif?.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const badge = notif.count > 0 ? (notif.count > 9 ? "9+" : String(notif.count)) : null;

  const panel = open ? (
    <div
      ref={panelRef}
      className="notifications-bell__panel notifications-bell__panel--portal glass-panel"
      role="dialog"
      aria-label="Notificações"
      style={{ top: panelPos.top, right: panelPos.right }}
    >
      <p className="notifications-bell__title">Notificações</p>
      {notif.items.length === 0 ? (
        <p className="notifications-bell__empty">Nenhuma pendência no momento.</p>
      ) : (
        <ul className="notifications-bell__list">
          {notif.items.map((item) => (
            <NotificationRow
              key={item.id}
              item={item}
              busyId={busyId}
              onAcceptFriend={acceptFriend}
              onRejectFriend={rejectFriend}
              onDismissInvite={dismissInvite}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </ul>
      )}
    </div>
  ) : null;

  return (
    <>
      <div className="notifications-bell">
        <button
          ref={triggerRef}
          type="button"
          className="notifications-bell__trigger"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={badge ? `${notif.count} notificações` : "Notificações"}
          data-site-tip="Notificações"
          onClick={toggleOpen}
        >
          <IconBell size={18} />
          {badge ? <span className="notifications-bell__badge">{badge}</span> : null}
        </button>
      </div>
      {panel ? createPortal(panel, document.body) : null}
    </>
  );
}

function NotificationRow({
  item,
  busyId,
  onAcceptFriend,
  onRejectFriend,
  onDismissInvite,
  onNavigate,
}: {
  item: NotificationItem;
  busyId: string | null;
  onAcceptFriend: (id: string) => void;
  onRejectFriend: (id: string) => void;
  onDismissInvite: (id: string) => void;
  onNavigate: () => void;
}) {
  const showAvatar = item.type === "friend_request" || item.type === "mesa_invite";
  const avatarLabel = item.meta?.fromDisplayName ?? item.body;

  return (
    <li className="notifications-bell__item">
      {showAvatar ? (
        <UserAvatar
          url={item.meta?.fromAvatarUrl ?? null}
          label={avatarLabel}
          className="notifications-bell__avatar"
        />
      ) : null}
      <div className="notifications-bell__item-content">
        <div className="notifications-bell__item-head">
          <span className="notifications-bell__item-title">{item.title}</span>
          <span className="notifications-bell__item-body">{item.body}</span>
        </div>
        <div className="notifications-bell__actions">
          {item.type === "friend_request" && item.meta?.requestId ? (
            <>
              <button
                type="button"
                className="btn btn-sm"
                disabled={busyId === item.meta.requestId}
                onClick={() => onAcceptFriend(item.meta!.requestId!)}
              >
                Aceitar
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={busyId === item.meta.requestId}
                onClick={() => onRejectFriend(item.meta!.requestId!)}
              >
                Recusar
              </button>
            </>
          ) : (
            <Link href={item.href} className="notifications-bell__link" onClick={onNavigate}>
              {item.type === "sheet_edit_player" && item.title === "Edição de ficha aprovada"
                ? "Abrir edição"
                : "Ver"}
            </Link>
          )}
          {item.type === "mesa_invite" && item.meta?.inviteId ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={busyId === item.meta.inviteId}
              onClick={() => onDismissInvite(item.meta!.inviteId!)}
            >
              Dispensar
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
