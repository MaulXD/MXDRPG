"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ENTRAR_PATH } from "@/lib/site-paths";
import { SiteNavLinks } from "@/components/SiteNavLinks";

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      {open ? (
        <>
          <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <line x1="15" y1="3" x2="3" y2="15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </>
      ) : (
        <>
          <line x1="3" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <line x1="3" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        className="mobile-nav__toggle"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen((v) => !v)}
      >
        <HamburgerIcon open={open} />
      </button>

      {open && (
        <>
          <div className="mobile-nav__backdrop" aria-hidden onClick={() => setOpen(false)} />
          <div
            id="mobile-nav-drawer"
            className="mobile-nav__drawer"
            role="dialog"
            aria-modal="false"
            aria-label="Menu de navegação"
          >
            <nav className="mobile-nav__links">
              <SiteNavLinks />
            </nav>
            {!isLoggedIn && (
              <div className="mobile-nav__footer">
                <Link href={ENTRAR_PATH} className="btn btn-primary" style={{ width: "100%" }}>
                  Entrar e jogar
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
