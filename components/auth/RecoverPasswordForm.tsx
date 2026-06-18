"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/auth/PasswordInput";
import "./auth-forms.css";

export function RecoverPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [hint, setHint] = useState("");
  const [cpfPrefix, setCpfPrefix] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/recover-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check", email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Falha ao verificar e-mail");
      return;
    }
    setHint(data.hint ?? "");
    if (data.canRecover) {
      setStep("reset");
    } else {
      setError(data.hint ?? "Recuperação indisponível para esta conta.");
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/recover-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reset",
        email,
        cpfPrefix,
        birthDate,
        password,
        passwordConfirm,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Falha ao redefinir senha");
      return;
    }
    router.push("/entrar?msg=" + encodeURIComponent("Senha atualizada — faça login."));
    router.refresh();
  }

  if (step === "email") {
    return (
      <form className="auth-form" onSubmit={checkEmail}>
        <p className="auth-form__intro">
          Informe o e-mail da conta. Usamos os <strong>5 primeiros dígitos do CPF</strong> e a{" "}
          <strong>data de nascimento</strong> cadastrados em{" "}
          <Link href="/conta">/conta</Link>.
        </p>
        <label className="auth-field">
          <span className="auth-field__label">E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="auth-field__input"
            placeholder="seu@email.com"
          />
        </label>
        {error ? (
          <p className="auth-form__error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="auth-form__actions">
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Verificando…" : "Continuar"}
          </button>
          <Link href="/entrar" className="auth-form__clear">
            Voltar
          </Link>
        </div>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={resetPassword}>
      {hint ? (
        <p className="auth-form__intro" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      ) : null}
      <label className="auth-field">
        <span className="auth-field__label">E-mail</span>
        <input type="email" value={email} readOnly className="auth-field__input" />
      </label>
      <label className="auth-field">
        <span className="auth-field__label">5 primeiros dígitos do CPF</span>
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          value={cpfPrefix}
          onChange={(e) => setCpfPrefix(e.target.value.replace(/\D/g, "").slice(0, 5))}
          required
          className="auth-field__input"
          placeholder="12345"
        />
      </label>
      <label className="auth-field">
        <span className="auth-field__label">Data de nascimento</span>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          required
          className="auth-field__input"
        />
      </label>
      <PasswordInput
        label="Nova senha (mín. 6)"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        minLength={6}
      />
      <PasswordInput
        label="Confirmar nova senha"
        value={passwordConfirm}
        onChange={setPasswordConfirm}
        autoComplete="new-password"
        minLength={6}
      />
      {error ? (
        <p className="auth-form__error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="auth-form__actions">
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Salvando…" : "Redefinir senha"}
        </button>
        <button type="button" className="auth-form__clear" onClick={() => setStep("email")}>
          Voltar
        </button>
      </div>
    </form>
  );
}
