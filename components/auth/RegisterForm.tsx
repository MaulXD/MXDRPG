"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/auth/PasswordInput";
import "./auth-forms.css";

type Props = { redirect?: string };

export function RegisterForm({ redirect = "" }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  function clearFields() {
    setName("");
    setNickname("");
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    setError("");
    setNotice("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    if (password !== passwordConfirm) {
      setLoading(false);
      setError("As senhas não coincidem — confira o que digitou.");
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
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

    if (data.completedSocialAccount) {
      setNotice("Senha definida com sucesso. Redirecionando…");
    } else if (data.existingAccountLogin) {
      setNotice("Conta já existia — você entrou com sucesso. Redirecionando…");
    }

    router.push(data.redirect ?? "/rpg");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={submit} autoComplete="on">
      <p className="auth-form__intro">
        Conta nova pode <strong>criar mesas</strong> como mestre — o código de convite é gerado
        automaticamente para jogadores entrarem. Se você entrou antes com Google/Discord, use o
        mesmo e-mail aqui para <strong>definir uma senha</strong>.
      </p>
      <label className="auth-field">
        <span className="auth-field__label">Nome</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className="auth-field__input"
          placeholder="Seu nome na mesa"
        />
      </label>
      <label className="auth-field">
        <span className="auth-field__label">Apelido (recomendado — login alternativo)</span>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z0-9_-]*"
          autoComplete="nickname"
          className="auth-field__input"
          placeholder="ex: meu_apelido"
        />
      </label>
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
      <PasswordInput
        label="Senha (mín. 6 caracteres)"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        minLength={6}
        placeholder="Crie uma senha"
        hint="Use Ver para conferir antes de criar a conta."
      />
      <PasswordInput
        label="Confirmar senha"
        value={passwordConfirm}
        onChange={setPasswordConfirm}
        autoComplete="new-password"
        minLength={6}
        placeholder="Repita a senha"
      />
      {error ? <p className="auth-form__error" role="alert">{error}</p> : null}
      {notice ? <p className="auth-form__success" role="status">{notice}</p> : null}
      <div className="auth-form__actions">
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Criando conta…" : "Criar conta"}
        </button>
        <button type="button" className="auth-form__clear" onClick={clearFields}>
          Limpar campos
        </button>
      </div>
    </form>
  );
}
