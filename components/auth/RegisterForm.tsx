"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { redirect?: string };

export function RegisterForm({ redirect = "" }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        nickname: nickname.trim() || undefined,
        email,
        password,
        redirect: redirect || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Falha no cadastro");
      return;
    }

    router.push(data.redirect ?? "/rpg");
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
        Conta nova pode <strong>criar mesas</strong> como mestre e definir um código de convite (até 10
        caracteres) para jogadores entrarem.
      </p>
      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
        Nome
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
          placeholder="Seu nome na mesa"
        />
      </label>
      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
        Apelido (recomendado — login alternativo)
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z0-9_-]*"
          style={inputStyle}
          placeholder="ex: meu_apelido"
        />
      </label>
      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
        E-mail
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
      </label>
      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
        Senha (mín. 6)
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={inputStyle}
        />
      </label>
      {error && <p style={{ color: "#ff6b8a", margin: 0, fontSize: "0.85rem" }}>{error}</p>}
      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Criando conta…" : "Criar conta"}
      </button>
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
