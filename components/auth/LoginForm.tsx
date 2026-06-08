"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/auth/PasswordInput";
import "./auth-forms.css";

const QUICK = [
  { login: "jogador", label: "Jogador" },
  { login: "mestre", label: "Mestre" },
] as const;

type Props = { redirect?: string };

export function LoginForm({ redirect = "" }: Props) {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function fillDemo(user: string) {
    setLogin(user);
    setPassword("123");
    setError("");
  }

  function clearFields() {
    setLogin("");
    setPassword("");
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ login, password, redirect }),
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
    <form className="auth-form" onSubmit={submit} autoComplete="on">
      <label className="auth-field">
        <span className="auth-field__label">E-mail, apelido ou usuário</span>
        <input
          type="text"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
          autoComplete="username"
          className="auth-field__input"
          placeholder="seu@email.com ou apelido"
        />
      </label>
      <PasswordInput
        label="Senha"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        placeholder="Sua senha"
      />
      {error ? <p className="auth-form__error" role="alert">{error}</p> : null}
      <div className="auth-form__actions">
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
        <button type="button" className="auth-form__clear" onClick={clearFields}>
          Limpar campos
        </button>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {QUICK.map((q) => (
          <button
            key={q.login}
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}
            onClick={() => fillDemo(q.login)}
          >
            Demo {q.label}
          </button>
        ))}
      </div>
    </form>
  );
}
