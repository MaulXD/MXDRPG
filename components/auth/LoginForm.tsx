"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/auth/PasswordInput";
import "./auth-forms.css";

type Props = { redirect?: string };

export function LoginForm({ redirect = "" }: Props) {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitLogin(loginValue: string, passwordValue: string) {
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ login: loginValue, password: passwordValue, redirect }),
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await submitLogin(login, password);
  }

  function clearFields() {
    setLogin("");
    setPassword("");
    setError("");
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
      {error ? (
        <p className="auth-form__error" role="alert">
          {error}
        </p>
      ) : null}
      <p style={{ margin: 0, fontSize: "0.8rem" }}>
        <Link href="/entrar/recuperar">Esqueci a senha</Link>
      </p>
      <div className="auth-form__actions">
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
        <button type="button" className="auth-form__clear" onClick={clearFields} disabled={loading}>
          Limpar campos
        </button>
      </div>
    </form>
  );
}
