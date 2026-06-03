"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

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
      <div className="vtt-chrome">
        <header className="vtt-topbar glass">
          <Link href="/" className="site-logo neon-title">
            ELDARIN
          </Link>
          <nav className="vtt-nav">
            <Link href="/mesa">Mesas</Link>
            <Link href="/biblioteca">Compêndios</Link>
            <Link href="/mestre">Mestre</Link>
            <Link href="/jogador">Jogador</Link>
          </nav>
          <div className="vtt-topbar-actions">
            <ThemeToggle />
          </div>
        </header>
        <main className="vtt-main">{children}</main>
      </div>
    );
  }

  return (
    <>
      {header}
      <main>{children}</main>
      {footer}
    </>
  );
}
