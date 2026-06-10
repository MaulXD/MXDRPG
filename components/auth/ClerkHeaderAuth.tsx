"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { AnimatedNavLink } from "@/components/AnimatedNavLink";
import { IconUser } from "@/components/ui/EldarinIcons";
import { ClerkHeaderUserMenu } from "@/components/auth/ClerkHeaderUserMenu";
import { FriendsNavLink } from "@/components/friends/FriendsNavLink";
import type { SessionUser } from "@/lib/auth/types";
import { portalPathForRole, roleMeta } from "@/lib/auth/roles";

type Props = {
  session: { user: SessionUser } | null;
};

/** Usa sessão do servidor no primeiro paint — evita flicker do Clerk `<Show>`. */
export function ClerkHeaderAuth({ session }: Props) {
  if (session) {
    return (
      <>
        <AnimatedNavLink href="/conta" icon={<IconUser size={18} />}>
          Perfil
        </AnimatedNavLink>
        <FriendsNavLink />
        <Link href={portalPathForRole(session.user.role)} className="btn nav-cta">
          {roleMeta(session.user.role).label}
        </Link>
        <ClerkHeaderUserMenu user={session.user} />
      </>
    );
  }

  return (
    <>
      <SignInButton mode="redirect" forceRedirectUrl="/entrar/apelido">
        <button type="button" className="btn nav-cta">
          Entrar
        </button>
      </SignInButton>
      <SignUpButton mode="redirect" forceRedirectUrl="/entrar/apelido">
        <button type="button" className="btn btn-secondary btn-sm">
          Criar conta
        </button>
      </SignUpButton>
    </>
  );
}
