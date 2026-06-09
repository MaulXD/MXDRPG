"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatedNavLink } from "@/components/AnimatedNavLink";
import { BugReportButton } from "@/components/BugReportButton";
import "@/components/vtt/mesa-theme.css";

type Props = {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
};

export function SiteShell({ children, header, footer }: Props) {
  const pathname = usePathname() ?? "";
  const isVtt = pathname.startsWith("/mesa/") && pathname !== "/mesa";

  if (isVtt) {
    return (
      <div className="vtt-chrome" data-vtt-mesa="foundry">
        <header className="vtt-topbar glass">
          <Link href="/" className="site-logo neon-title">
            ELDARIN
          </Link>
          <nav className="vtt-nav">
            <AnimatedNavLink href="/mesa">Mesas</AnimatedNavLink>
            <AnimatedNavLink href="/biblioteca">Compêndios</AnimatedNavLink>
            <AnimatedNavLink href="/eldarin">Minhas mesas</AnimatedNavLink>
          </nav>
        </header>
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
