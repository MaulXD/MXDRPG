"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatedNavLink } from "@/components/AnimatedNavLink";
import { VttTopbarUserMenu } from "@/components/auth/VttTopbarUserMenu";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import { FriendsNavMessages } from "@/components/friends/FriendsNavMessages";
import { MesasNavLink } from "@/components/nav/MesasNavLink";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { IconBook, IconScroll } from "@/components/ui/EldarinIcons";
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
                <MesasNavLink variant="vtt" />
                <AnimatedNavLink href="/compendios" icon={<IconBook size={18} />}>
                  Compêndios
                </AnimatedNavLink>
                <AnimatedNavLink href="/sistema" icon={<IconScroll size={18} />}>
                  Sistema
                </AnimatedNavLink>
              </nav>
              <div className="site-nav__end vtt-topbar__social">
                <NotificationsBell />
                <FriendsNavMessages />
                <VttTopbarUserMenu />
              </div>
            </div>
          </header>
          {topbarReady && !topbarHidden ? (
            <button
              type="button"
              className="vtt-topbar-tab vtt-topbar-tab--collapse glass"
              onClick={hideTopbar}
              aria-label="Ocultar barra de navegação"
              title="Ocultar menu"
            >
              <span className="vtt-topbar-tab__chevron vtt-topbar-tab__chevron--up" aria-hidden />
            </button>
          ) : null}
        </div>
        {topbarReady && topbarHidden ? (
          <button
            type="button"
            className="vtt-topbar-tab vtt-topbar-tab--reveal glass"
            onClick={showTopbar}
            aria-label="Mostrar barra de navegação"
            title="Mostrar menu"
          >
            <span className="vtt-topbar-tab__chevron vtt-topbar-tab__chevron--down" aria-hidden />
          </button>
        ) : null}
        <main key={pathname} className="vtt-main page-enter">
          {children}
        </main>
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
    </>
  );
}
