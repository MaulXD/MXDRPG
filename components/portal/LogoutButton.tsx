"use client";

import { useRouter } from "next/navigation";
import { ENTRAR_PATH } from "@/lib/site-paths";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
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
