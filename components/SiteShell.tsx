"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatedNavLink } from "@/components/AnimatedNavLink";
import { VttTopbarUserMenu } from "@/components/auth/VttTopbarUserMenu";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import { FriendsNavIcon } from "@/components/friends/FriendsNavIcon";
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
  const [transitionPhase, setTransitionPhase] = useState<"idle" | "exiting-site">("idle");
  const prevIsVttRef = useRef(isVtt);
  const prevChildrenRef = useRef(children);
  const prevHeaderRef = useRef(header);
  const prevFooterRef = useRef(footer);

  // Snapshot old children when transitioning site→VTT
  if (!isVtt) {
    prevChildrenRef.current = children;
    prevHeaderRef.current = header;
    prevFooterRef.current = footer;
  }

  useEffect(() => {
    const wasVtt = prevIsVttRef.current;
    if (!wasVtt && isVtt) {
      setTransitionPhase("exiting-site");
      const t = setTimeout(() => setTransitionPhase("idle"), 350);
      return () => clearTimeout(t);
    }
    prevIsVttRef.current = isVtt;
  }, [isVtt]);

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

  // During site→VTT transition: render both, site exits up, VTT fades in
  if (transitionPhase === "exiting-site") {
    return (
      <>
        <div className="site-mode site-mode--exiting">
          {prevHeaderRef.current}
          <main className="page-enter">{prevChildrenRef.current}</main>
          {prevFooterRef.current}
        </div>
        <div
          className="vtt-chrome vtt-chrome--entering"
          data-vtt-mesa="foundry"
        >
          <VttTopbarContent
            topbarReady={topbarReady}
            topbarHidden={topbarHidden}
            hideTopbar={hideTopbar}
            showTopbar={showTopbar}
          />
          <main key={pathname} className="vtt-main page-enter">
            {children}
          </main>
        </div>
      </>
    );
  }

  if (isVtt) {
    return (
      <div
        className={`vtt-chrome${topbarHidden ? " vtt-chrome--topbar-hidden" : ""}`}
        data-vtt-mesa="foundry"
      >
        <VttTopbarContent
          topbarReady={topbarReady}
          topbarHidden={topbarHidden}
          hideTopbar={hideTopbar}
          showTopbar={showTopbar}
        />
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

function VttTopbarContent({
  topbarReady,
  topbarHidden,
  hideTopbar,
  showTopbar,
}: {
  topbarReady: boolean;
  topbarHidden: boolean;
  hideTopbar: () => void;
  showTopbar: () => void;
}) {
  return (
    <>
      <div className="vtt-topbar-shell">
        <header className="vtt-topbar glass">
          {topbarReady && !topbarHidden ? (
            <EldarinLogo variant="header" image="navbar" />
          ) : (
            <span className="eldarin-logo eldarin-logo--header" aria-hidden />
          )}
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
              <FriendsNavIcon />
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
    </>
  );
}
