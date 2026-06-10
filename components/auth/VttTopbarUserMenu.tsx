"use client";

import { ClerkHeaderUserMenu } from "@/components/auth/ClerkHeaderUserMenu";
import { HeaderUserMenu } from "@/components/auth/HeaderUserMenu";
import { hasClerkPublishableKey } from "@/lib/auth/clerk-config";

/** Menu do usuário na topbar VTT (mesa) — bug report e sair. */
export function VttTopbarUserMenu() {
  if (hasClerkPublishableKey()) {
    return <ClerkHeaderUserMenu />;
  }
  return <HeaderUserMenu />;
}
