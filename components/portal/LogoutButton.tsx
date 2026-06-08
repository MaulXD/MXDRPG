"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const CLERK_ON = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());

function LegacyLogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    router.push("/entrar");
    router.refresh();
  }

  return (
    <button
      type="button"
      className="btn"
      style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}
      onClick={() => void logout()}
    >
      Sair
    </button>
  );
}

function ClerkAwareLogoutButton() {
  const router = useRouter();
  const { signOut } = useClerk();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    try {
      await signOut();
    } catch {
      /* sessão Clerk pode já ter expirado */
    }
    router.push("/entrar");
    router.refresh();
  }

  return (
    <button
      type="button"
      className="btn"
      style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}
      onClick={() => void logout()}
    >
      Sair
    </button>
  );
}

export function LogoutButton() {
  return CLERK_ON ? <ClerkAwareLogoutButton /> : <LegacyLogoutButton />;
}
