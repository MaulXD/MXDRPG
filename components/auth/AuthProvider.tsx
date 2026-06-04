"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  enabled: boolean;
};

export function AuthProvider({ children, enabled }: Props) {
  if (!enabled) return children;
  return <ClerkProvider>{children}</ClerkProvider>;
}
