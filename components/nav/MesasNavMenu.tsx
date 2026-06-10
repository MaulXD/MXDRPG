"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconHex } from "@/components/ui/EldarinIcons";
import { RpgSystemCoverCard } from "@/components/rpg/RpgSystemCoverCard";
import { isMesasNavActive, MESAS_HUB_PATH, RPG_SYSTEMS } from "@/lib/rpg/systems";
import "@/components/rpg/mesas-hub.css";

type Props = {
  /** Estilo da topbar VTT (mesma aparência dos outros links). */
  variant?: "site" | "vtt";
};

export function MesasNavMenu({ variant = "site" }: Props) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const active = isMesasNavActive(pathname);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPanelPos({
      top: rect.bottom + 8,
      left: Math.max(8, rect.left),
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

  const toggle = useCallback(() => {
    setOpen((was) => {
      if (was) return false;
      updatePanelPosition();
      return true;
    });
  }, [updatePanelPosition]);

  const triggerClass = [
    variant === "vtt" ? "nav-link mesas-nav__trigger" : "mesas-nav__trigger nav-link",
    active ? " nav-link--active" : "",
  ].join("");

  const panel = open ? (
    <div
      ref={panelRef}
      className="mesas-nav__panel mesas-nav__panel--portal glass-panel"
      role="menu"
      style={{ top: panelPos.top, left: panelPos.left }}
    >
      <p className="mesas-nav__title">MXDRPG · sistemas</p>
      <ul className="mesas-nav__list" role="none">
        {RPG_SYSTEMS.map((sys) => (
          <li key={sys.id} role="none">
            <RpgSystemCoverCard system={sys} variant="compact" />
          </li>
        ))}
      </ul>
      <p className="mesas-nav__footer">
        <Link href={MESAS_HUB_PATH} onClick={() => setOpen(false)}>
          Ver todas as capas →
        </Link>
      </p>
    </div>
  ) : null;

  return (
    <div className="mesas-nav">
      <button
        ref={triggerRef}
        type="button"
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Mesas e RPGs"
        onClick={toggle}
      >
        <IconHex size={18} className="nav-link__icon" />
        <span className="nav-link__label">Mesas</span>
        <span className="mesas-nav__chevron" aria-hidden>
          ▾
        </span>
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
