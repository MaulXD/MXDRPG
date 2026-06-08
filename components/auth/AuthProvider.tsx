"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { clerkSocialOnlyAppearance } from "@/lib/auth/clerk-appearance";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

type Props = {
  children: ReactNode;
};

/**
 * Sempre envolve com ClerkProvider quando a chave pública existe (inlined no build).
 * Não depende de CLERK_SECRET_KEY no servidor — SignIn/SignOut precisam do provider no client.
 */
export function AuthProvider({ children }: Props) {
  if (!publishableKey) return <>{children}</>;
  return (
    <ClerkProvider publishableKey={publishableKey} appearance={clerkSocialOnlyAppearance}>
      {children}
    </ClerkProvider>
  );
}
