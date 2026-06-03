"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const QUICK = [
  { email: "jogador@vinite.local", label: "Demo" },
];

type Props = { redirect?: string };

export function LoginForm({ redirect = "" }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, redirect }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Falha no login");
      return;
    }

    router.push(data.redirect);
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
        E-mail
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
          placeholder="jogador@vinite.local"
        />
      </label>
      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
        Senha
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
      </label>
      {error && <p style={{ color: "#ff6b8a", margin: 0, fontSize: "0.85rem" }}>{error}</p>}
      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Entrando…" : "Entrar"}
      </button>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {QUICK.map((q) => (
          <button
            key={q.email}
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}
            onClick={() => setEmail(q.email)}
          >
            {q.label}
          </button>
        ))}
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "0.35rem",
  padding: "0.65rem 0.85rem",
  borderRadius: 10,
  border: "1px solid var(--glass-border)",
  background: "rgba(0,0,0,0.4)",
  color: "var(--text)",
  fontFamily: "var(--font-body)",
  fontSize: "0.95rem",
  outline: "none",
};
