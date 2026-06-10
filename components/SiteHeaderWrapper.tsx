import { ClerkHeaderAuth } from "@/components/auth/ClerkHeaderAuth";
import { HeaderUserMenu } from "@/components/auth/HeaderUserMenu";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
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
      <nav className="site-nav">
        <SiteNavLinks />
        {clerkEnabled ? (
          <ClerkHeaderAuth session={session} />
        ) : session ? (
          <div className="site-nav__end">
            <NotificationsBell />
            <FriendsNavMessages />
            <HeaderUserMenu user={session.user} />
          </div>
        ) : (
          <Link href="/sign-in" className="btn nav-cta">
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}
