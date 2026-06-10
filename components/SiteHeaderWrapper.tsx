import { ClerkHeaderAuth } from "@/components/auth/ClerkHeaderAuth";
import { HeaderUserMenu } from "@/components/auth/HeaderUserMenu";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import { FriendsNavIcon } from "@/components/friends/FriendsNavIcon";
import { FriendsNavMessages } from "@/components/friends/FriendsNavMessages";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { hasClerkPublishableKey } from "@/lib/auth/clerk-config";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import { SiteNavLinks } from "@/components/SiteNavLinks";

export async function SiteHeaderWrapper() {
  const session = await getSession();
  const clerkEnabled = hasClerkPublishableKey();

  return (
    <header className="glass site-header">
      <EldarinLogo variant="header" image="navbar" />
      <nav className="site-nav" aria-label="Principal">
        <div className="site-nav__cluster">
          <div className="site-nav__links">
            <SiteNavLinks />
          </div>
          {clerkEnabled ? (
            <ClerkHeaderAuth session={session} />
          ) : session ? (
            <div className="site-nav__end">
              <NotificationsBell />
              <FriendsNavIcon />
              <FriendsNavMessages />
              <HeaderUserMenu user={session.user} />
            </div>
          ) : (
            <Link href="/sign-in" className="btn nav-cta">
              Entrar
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
