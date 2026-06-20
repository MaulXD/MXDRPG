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
  // Sempre relê do DB — o cookie pode estar desatualizado (avatar trocado após o login,
  // data URL cortada pelo limite de tamanho, ou avatarSource diferente do atual no banco).
  const navUser = session
    ? await safeMaterializeSessionUser(session.user)
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
