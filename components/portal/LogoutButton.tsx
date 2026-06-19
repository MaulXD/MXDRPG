"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ENTRAR_PATH } from "@/lib/site-paths";

export function LogoutButton() {
  const router = useRouter();
  const { signOut } = useClerk();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    try {
      await signOut();
    } catch {
      /* sessão Clerk pode já ter expirado */
    }
    router.push(ENTRAR_PATH);
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
