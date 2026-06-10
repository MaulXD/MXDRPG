"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatedNavLink } from "@/components/AnimatedNavLink";
import { BugReportButton } from "@/components/BugReportButton";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import { FriendsNavChat } from "@/components/friends/FriendsNavChat";
import { IconBook, IconHex, IconStar } from "@/components/ui/EldarinIcons";
import "@/components/vtt/mesa-theme.css";

const VT_TOPBAR_HIDDEN_KEY = "eldarin-vtt-topbar-hidden";

type Props = {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
};

export function SiteShell({ children, header, footer }: Props) {
  const pathname = usePathname() ?? "";
  const isVtt = pathname.startsWith("/mesa/") && pathname !== "/mesa";
  const [topbarHidden, setTopbarHidden] = useState(false);
  const [topbarReady, setTopbarReady] = useState(false);

  useEffect(() => {
    try {
      setTopbarHidden(localStorage.getItem(VT_TOPBAR_HIDDEN_KEY) === "1");
    } catch {
      /* ignore */
    } finally {
      setTopbarReady(true);
    }
  }, []);

  const hideTopbar = useCallback(() => {
    setTopbarHidden(true);
    try {
      localStorage.setItem(VT_TOPBAR_HIDDEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const showTopbar = useCallback(() => {
    setTopbarHidden(false);
    try {
      localStorage.setItem(VT_TOPBAR_HIDDEN_KEY, "0");
    } catch {
      /* ignore */
    }
  }, []);

  if (isVtt) {
    return (
      <div
        className={`vtt-chrome${topbarHidden ? " vtt-chrome--topbar-hidden" : ""}`}
        data-vtt-mesa="foundry"
      >
        <div className="vtt-topbar-shell">
          <header className="vtt-topbar glass">
            <EldarinLogo variant="header" image="navbar" />
            <div className="vtt-topbar__end">
              <nav className="vtt-nav">
                <AnimatedNavLink href="/mesa" icon={<IconHex size={18} />}>
                  Mesas
                </AnimatedNavLink>
                <AnimatedNavLink href="/compendios" icon={<IconBook size={18} />}>
                  Compêndios
                </AnimatedNavLink>
                <AnimatedNavLink href="/eldarin" icon={<IconStar size={18} />}>
                  Minhas mesas
                </AnimatedNavLink>
                <FriendsNavChat />
              </nav>
              <button
                type="button"
                className="vtt-topbar-toggle vtt-topbar-toggle--hide"
                onClick={hideTopbar}
                aria-label="Ocultar barra de navegação"
                title="Ocultar menu"
              >
                <span className="vtt-topbar-toggle__chevron" aria-hidden />
              </button>
            </div>
          </header>
        </div>
        {topbarReady && topbarHidden ? (
          <button
            type="button"
            className="vtt-topbar-reveal glass"
            onClick={showTopbar}
            aria-label="Mostrar barra de navegação"
            title="Mostrar menu"
          >
            <span className="vtt-topbar-toggle__chevron vtt-topbar-toggle__chevron--down" aria-hidden />
          </button>
        ) : null}
        <main key={pathname} className="vtt-main page-enter">
          {children}
        </main>
        <BugReportButton variant="vtt" />
      </div>
    );
  }

  return (
    <>
      {header}
      <main key={pathname} className="page-enter">
        {children}
      </main>
      {footer}
      <BugReportButton variant="site" />
    </>
  );
}
