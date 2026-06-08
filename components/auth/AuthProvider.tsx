"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { clerkSocialOnlyAppearance } from "@/lib/auth/clerk-appearance";

type Props = {
  children: ReactNode;
  enabled: boolean;
};

export function AuthProvider({ children, enabled }: Props) {
  if (!enabled) return children;
  return <ClerkProvider appearance={clerkSocialOnlyAppearance}>{children}</ClerkProvider>;
}
