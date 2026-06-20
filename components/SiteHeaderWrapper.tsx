import { HeaderUserMenu } from "@/components/auth/HeaderUserMenu";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import { FriendsNavIcon } from "@/components/friends/FriendsNavIcon";
import { FriendsNavMessages } from "@/components/friends/FriendsNavMessages";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { getSession } from "@/lib/auth/session";
import { safeMaterializeSessionUser } from "@/lib/auth/session-user";
import Link from "next/link";
import { ENTRAR_PATH } from "@/lib/site-paths";
import { SiteNavLinks } from "@/components/SiteNavLinks";

export async function SiteHeaderWrapper() {
  const session = await getSession();
  // Re-read from DB if session cookie stripped the avatar (data URL → null).
  // Always read fresh from DB for custom-avatar users so the navbar reflects
  // the user's selection even when the cookie has a stale or stripped avatarUrl.
  const navUser = session
    ? session.user.avatarSource === "custom"
      ? await safeMaterializeSessionUser(session.user)
      : session.user
    : null;

  return (
    <header className="glass site-header">
      <EldarinLogo variant="header" image="navbar" />
      <nav className="site-nav" aria-label="Principal">
        <div className="site-nav__cluster">
          <div className="site-nav__links">
            <SiteNavLinks />
          </div>
          {session ? (
            <div className="site-nav__end">
              <NotificationsBell />
              <FriendsNavIcon />
              <FriendsNavMessages />
              <HeaderUserMenu user={navUser} />
            </div>
          ) : (
            <Link href={ENTRAR_PATH} className="btn nav-cta">
              Entrar
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
