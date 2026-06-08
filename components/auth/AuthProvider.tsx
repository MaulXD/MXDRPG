"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { clerkSocialOnlyAppearance } from "@/lib/auth/clerk-appearance";

type Props = {
  children: ReactNode;
  /** Passada pelo layout server — evita depender só do inline de build no client. */
  publishableKey: string;
};

export function AuthProvider({ children, publishableKey }: Props) {
  const key = publishableKey.trim();
  if (!key) return <>{children}</>;
  return (
    <ClerkProvider publishableKey={key} appearance={clerkSocialOnlyAppearance}>
      {children}
    </ClerkProvider>
  );
}
