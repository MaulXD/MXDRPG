"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { ClerkHeaderUserMenu } from "@/components/auth/ClerkHeaderUserMenu";
import { FriendsNavIcon } from "@/components/friends/FriendsNavIcon";
import { FriendsNavMessages } from "@/components/friends/FriendsNavMessages";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import type { SessionUser } from "@/lib/auth/types";
import { PROFILE_ONBOARDING_PATH } from "@/lib/auth/profile-onboarding";

type Props = {
  session: { user: SessionUser } | null;
};

/** Usa sessão do servidor no primeiro paint — evita flicker do Clerk `<Show>`. */
export function ClerkHeaderAuth({ session }: Props) {
  if (session) {
    return (
      <div className="site-nav__end">
        <NotificationsBell />
        <FriendsNavIcon />
        <FriendsNavMessages />
        <ClerkHeaderUserMenu user={session.user} />
      </div>
    );
  }

  return (
    <>
      <SignInButton mode="redirect" forceRedirectUrl={PROFILE_ONBOARDING_PATH}>
        <button type="button" className="btn nav-cta">
          Entrar
        </button>
      </SignInButton>
      <SignUpButton mode="redirect" forceRedirectUrl={PROFILE_ONBOARDING_PATH}>
        <button type="button" className="btn btn-secondary btn-sm">
          Criar conta
        </button>
      </SignUpButton>
    </>
  );
}
