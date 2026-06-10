import { ClerkHeaderAuth } from "@/components/auth/ClerkHeaderAuth";
import { HeaderUserMenu } from "@/components/auth/HeaderUserMenu";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import { FriendsNavChat } from "@/components/friends/FriendsNavChat";
import { hasClerkPublishableKey } from "@/lib/auth/clerk-config";
import { getSession } from "@/lib/auth/session";
import { portalPathForRole, roleMeta } from "@/lib/auth/roles";
import Link from "next/link";
import { AnimatedNavLink } from "@/components/AnimatedNavLink";
import { SiteNavLinks } from "@/components/SiteNavLinks";
import { IconUser } from "@/components/ui/EldarinIcons";

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
          <>
            <AnimatedNavLink href="/conta" icon={<IconUser size={18} />}>
              Perfil
            </AnimatedNavLink>
            <FriendsNavChat />
            <Link href={portalPathForRole(session.user.role)} className="btn nav-cta">
              {roleMeta(session.user.role).label}
            </Link>
            <HeaderUserMenu user={session.user} />
          </>
        ) : (
          <Link href="/sign-in" className="btn nav-cta">
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}
