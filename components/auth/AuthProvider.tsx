"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useEffect, type ReactNode } from "react";
import { clerkSocialOnlyAppearance } from "@/lib/auth/clerk-appearance";

type Props = {
  children: ReactNode;
  /** Passada pelo layout server — evita depender só do inline de build no client. */
  publishableKey: string;
};

export function AuthProvider({ children, publishableKey }: Props) {
  const key = publishableKey.trim();

  useEffect(() => {
    if (!key.startsWith("pk_test_")) return;
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return;
    console.warn(
      "[Eldarin] Clerk usa chave de desenvolvimento (pk_test_) fora de localhost. " +
        "Configure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_… e CLERK_SECRET_KEY=sk_live_… " +
        "no ambiente Production da Vercel."
    );
  }, [key]);

  if (!key) return <>{children}</>;
  return (
    <ClerkProvider publishableKey={key} appearance={clerkSocialOnlyAppearance}>
      {children}
    </ClerkProvider>
  );
}
