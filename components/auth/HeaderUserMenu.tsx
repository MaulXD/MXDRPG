"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { SessionUser } from "@/lib/auth/types";
import type { PortraitFocus } from "@/lib/media/portrait-focus";

type Props = {
  user?: SessionUser | null;
  /** Clerk: passa signOut do useClerk no componente pai. */
  onSignOut?: () => void | Promise<void>;
};

function userLabel(user: SessionUser): string {
  if (user.nickname?.trim()) return `@${user.nickname.trim()}`;
  return user.name.trim() || user.email.split("@")[0] || "Jogador";
}

export function HeaderUserMenu({ user: initialUser, onSignOut }: Props) {
  const [user, setUser] = useState<SessionUser | null>(initialUser ?? null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      return;
    }
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { user?: SessionUser };
        if (data.user) setUser(data.user);
      } catch {
        /* ignore */
      }
    })();
  }, [initialUser]);

  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const signOut = useCallback(async () => {
    setOpen(false);
    if (onSignOut) {
      await onSignOut();
      return;
    }
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/sign-in";
  }, [onSignOut]);

  if (!user) return null;

  const label = userLabel(user);

  return (
    <div className="header-user-menu" ref={rootRef}>
      <button
        type="button"
        className="header-user-menu__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        title={label}
        onClick={() => setOpen((v) => !v)}
      >
        <UserAvatar
          url={user.avatarUrl}
          focus={user.avatarFocus as PortraitFocus | null}
          label={label}
          className="user-avatar--nav"
        />
      </button>

      {open ? (
        <div className="header-user-menu__panel glass" role="menu">
          <p className="header-user-menu__label">{label}</p>
          <Link href="/conta" className="header-user-menu__item" role="menuitem" onClick={() => setOpen(false)}>
            Editar perfil
          </Link>
          <button type="button" className="header-user-menu__item header-user-menu__item--danger" role="menuitem" onClick={() => void signOut()}>
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}
