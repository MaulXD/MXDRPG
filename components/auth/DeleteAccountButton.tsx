"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAccountButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (
      !confirm(
        "Excluir conta e todas as fichas? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/account", { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Falha ao excluir");
      return;
    }
    const data = await res.json();
    router.push(data.redirect ?? "/entrar");
    router.refresh();
  }

  return (
    <button
      type="button"
      className="btn btn-secondary"
      style={{ fontSize: "0.8rem", marginTop: "2rem", opacity: 0.85 }}
      disabled={loading}
      onClick={remove}
    >
      {loading ? "Excluindo…" : "Excluir minha conta"}
    </button>
  );
}
