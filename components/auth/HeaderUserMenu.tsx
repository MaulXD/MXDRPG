"use client";

import "@/components/ui/user-avatar.css";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
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

  const toggleMenu = useCallback(() => {
    setOpen((wasOpen) => {
      if (wasOpen) return false;
      updatePanelPosition();
      return true;
    });
  }, [updatePanelPosition]);

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

  const panel = open ? (
      <div
        ref={panelRef}
        className="header-user-menu__panel header-user-menu__panel--portal"
        role="menu"
        style={{ top: panelPos.top, right: panelPos.right }}
      >
        <p className="header-user-menu__label">{label}</p>
        <Link
          href="/conta"
          className="header-user-menu__item"
          role="menuitem"
          onClick={() => setOpen(false)}
        >
          Editar perfil
        </Link>
        <button
          type="button"
          className="header-user-menu__item header-user-menu__item--danger"
          role="menuitem"
          onClick={() => void signOut()}
        >
          Sair
        </button>
      </div>
    ) : null;

  return (
    <>
      <div className="header-user-menu">
        <button
          ref={triggerRef}
          type="button"
          className="header-user-menu__trigger"
          aria-expanded={open}
          aria-haspopup="menu"
          title={label}
          onClick={toggleMenu}
        >
          <UserAvatar
            url={user.avatarUrl}
            focus={user.avatarFocus as PortraitFocus | null}
            label={label}
            className="user-avatar--nav"
          />
        </button>
      </div>
      {panel ? createPortal(panel, document.body) : null}
    </>
  );
}
