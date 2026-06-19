import Link from "next/link";
import { MESAS_HUB_PATH } from "@/lib/site-paths";
import type { SessionUser } from "@/lib/auth/types";
import { roleMeta } from "@/lib/auth/roles";
import { LogoutButton } from "./LogoutButton";

type Props = {
  user: SessionUser;
  children: React.ReactNode;
};

export function PortalShell({ user, children }: Props) {
  const meta = roleMeta(user.role);

  return (
    <div className="page-wrap portal-page">
      <header className="glass portal-header">
        <div className="portal-header__meta">
          <p className="portal-header__eyebrow">PORTAL · {meta.label.toUpperCase()}</p>
          <h1 className="portal-header__title">{user.name}</h1>
          <p className="portal-header__sub">{user.email}</p>
        </div>
        <nav className="portal-header__nav" aria-label="Navegação do portal">
          <Link href="/" className="btn btn-secondary btn-sm">
            Site
          </Link>
          {meta.homePath === "/admin" && (
            <Link href="/admin" className="btn btn-secondary btn-sm">
              Admin
            </Link>
          )}
          <Link href={MESAS_HUB_PATH} className="btn btn-secondary btn-sm">
            Mesas
          </Link>
          <Link href="/mesa/demo" prefetch={false} className="btn btn-secondary btn-sm">
            VTT demo
          </Link>
          <LogoutButton />
        </nav>
      </header>
      {children}
    </div>
  );
}
