"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  return <>{children}</>;
}
