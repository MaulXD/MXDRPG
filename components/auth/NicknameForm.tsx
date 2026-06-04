"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NicknameForm() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/nickname", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Falha ao salvar");
      return;
    }

    router.push("/painel");
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
        Apelido (3–24 caracteres)
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z0-9_-]+"
          autoComplete="username"
          style={inputStyle}
          placeholder="ex: raul_mesa"
        />
      </label>
      {error && <p style={{ color: "#ff6b8a", margin: 0, fontSize: "0.85rem" }}>{error}</p>}
      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Salvando…" : "Continuar"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "0.35rem",
  padding: "0.65rem 0.75rem",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
};
