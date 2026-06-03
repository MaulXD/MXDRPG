"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/entrar");
    router.refresh();
  }

  return (
    <button type="button" className="btn" style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }} onClick={logout}>
      Sair
    </button>
  );
}
