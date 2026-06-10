"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconBell } from "@/components/ui/EldarinIcons";
import { useNotifications } from "@/components/notifications/NotificationsProvider";
import type { NotificationItem } from "@/lib/notifications/types";

const fetchOpts = { credentials: "same-origin" as const };

export function NotificationsBell() {
  const notif = useNotifications();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

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

  return (
    <div className="notifications-bell" ref={rootRef}>
      <button
        type="button"
        className="notifications-bell__trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={badge ? `${notif.count} notificações` : "Notificações"}
        title="Notificações"
        onClick={() => setOpen((v) => !v)}
      >
        <IconBell size={18} />
        {badge ? <span className="notifications-bell__badge">{badge}</span> : null}
      </button>

      {open ? (
        <div
          className="notifications-bell__panel glass-panel"
          role="dialog"
          aria-label="Notificações"
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
                  onDismissInvite={dismissInvite}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function NotificationRow({
  item,
  busyId,
  onAcceptFriend,
  onDismissInvite,
  onNavigate,
}: {
  item: NotificationItem;
  busyId: string | null;
  onAcceptFriend: (id: string) => void;
  onDismissInvite: (id: string) => void;
  onNavigate: () => void;
}) {
  return (
    <li className="notifications-bell__item">
      <div className="notifications-bell__item-head">
        <span className="notifications-bell__item-title">{item.title}</span>
        <span className="notifications-bell__item-body">{item.body}</span>
      </div>
      <div className="notifications-bell__actions">
        <Link href={item.href} className="notifications-bell__link" onClick={onNavigate}>
          Ver
        </Link>
        {item.type === "friend_request" && item.meta?.requestId ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={busyId === item.meta.requestId}
            onClick={() => onAcceptFriend(item.meta!.requestId!)}
          >
            Aceitar
          </button>
        ) : null}
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
    </li>
  );
}
