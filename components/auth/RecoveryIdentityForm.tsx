"use client";

import { useState } from "react";
import "./auth-forms.css";

type Props = {
  initialHasRecovery?: boolean;
};

export function RecoveryIdentityForm({ initialHasRecovery = false }: Props) {
  const [cpfPrefix, setCpfPrefix] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(initialHasRecovery ? "Recuperação já cadastrada — salve de novo para atualizar." : "");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const res = await fetch("/api/auth/recovery-identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ cpfPrefix, birthDate }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Falha ao salvar");
      return;
    }
    setNotice("Dados de recuperação salvos. Use-os em Esqueci a senha se precisar.");
    setCpfPrefix("");
    setBirthDate("");
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <p className="auth-form__intro" style={{ marginTop: 0 }}>
        Para recuperar senha sem e-mail: cadastre os <strong>5 primeiros dígitos do CPF</strong> e
        sua <strong>data de nascimento</strong>. Não armazenamos o CPF completo.
      </p>
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
      {error ? (
        <p className="auth-form__error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="auth-form__success" role="status">
          {notice}
        </p>
      ) : null}
      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Salvando…" : "Salvar recuperação"}
      </button>
    </form>
  );
}
