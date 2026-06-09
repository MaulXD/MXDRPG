import { ClerkHeaderAuth } from "@/components/auth/ClerkHeaderAuth";
import { hasClerkPublishableKey } from "@/lib/auth/clerk-config";
import { getSession } from "@/lib/auth/session";
import { portalPathForRole, roleMeta } from "@/lib/auth/roles";
import Link from "next/link";
import { AnimatedNavLink } from "@/components/AnimatedNavLink";

const links = [
  { href: "/", label: "Início" },
  { href: "/sistema", label: "Sistema" },
  { href: "/biblioteca", label: "Compêndios" },
];

export async function SiteHeaderWrapper() {
  const session = await getSession();
  const clerkEnabled = hasClerkPublishableKey();

  return (
    <header className="glass site-header">
      <Link href="/" className="site-logo neon-title">
        ELDARIN
      </Link>
      <nav className="site-nav">
        {links.map((l) => (
          <AnimatedNavLink key={l.href} href={l.href} exact={l.href === "/"}>
            {l.label}
          </AnimatedNavLink>
        ))}
        {clerkEnabled ? (
          <ClerkHeaderAuth session={session} />
        ) : session ? (
          <Link href={portalPathForRole(session.user.role)} className="btn nav-cta">
            {roleMeta(session.user.role).label}
          </Link>
        ) : (
          <Link href="/sign-in" className="btn nav-cta">
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}
