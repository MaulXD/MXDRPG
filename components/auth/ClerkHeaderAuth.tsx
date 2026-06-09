"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { AnimatedNavLink } from "@/components/AnimatedNavLink";
import { FriendsNavBadge } from "@/components/friends/FriendsNavBadge";
import type { SessionUser } from "@/lib/auth/types";
import { portalPathForRole, roleMeta } from "@/lib/auth/roles";
import { clerkSocialOnlyAppearance } from "@/lib/auth/clerk-appearance";

type Props = {
  session: { user: SessionUser } | null;
};

export function ClerkHeaderAuth({ session }: Props) {
  return (
    <>
      <Show when="signed-out">
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
      </Show>
      <Show when="signed-in">
        <AnimatedNavLink href="/conta">Perfil</AnimatedNavLink>
        <FriendsNavBadge />
        {session ? (
          <Link href={portalPathForRole(session.user.role)} className="btn nav-cta">
            {roleMeta(session.user.role).label}
          </Link>
        ) : null}
        <UserButton appearance={clerkSocialOnlyAppearance} />
      </Show>
    </>
  );
}
