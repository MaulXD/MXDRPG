"use client";

import { useClerk } from "@clerk/nextjs";
import { HeaderUserMenu } from "@/components/auth/HeaderUserMenu";
import type { SessionUser } from "@/lib/auth/types";

type Props = {
  user?: SessionUser | null;
};

export function ClerkHeaderUserMenu({ user }: Props) {
  const clerk = useClerk();

  return (
    <HeaderUserMenu
      user={user}
      onSignOut={async () => {
        if (clerk.loaded && clerk.signOut) {
          await clerk.signOut({ redirectUrl: "/" });
        }
      }}
    />
  );
}
