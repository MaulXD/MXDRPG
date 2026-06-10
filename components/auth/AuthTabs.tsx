"use client";

import { useState } from "react";
import "./auth-forms.css";
import { ClerkSignInLinks } from "@/components/auth/ClerkSignInLinks";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

type Props = { redirect?: string; clerkEnabled?: boolean };

export function AuthTabs({ redirect = "", clerkEnabled = false }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <div>
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tabs__btn ${tab === "login" ? "btn" : "btn btn-secondary"}`}
          onClick={() => setTab("login")}
        >
          Entrar
        </button>
        <button
          type="button"
          className={`auth-tabs__btn ${tab === "register" ? "btn" : "btn btn-secondary"}`}
          onClick={() => setTab("register")}
        >
          Criar conta
        </button>
      </div>
      {clerkEnabled ? (
        <p className="auth-form__intro" style={{ marginBottom: "0.25rem" }}>
          Login com e-mail/senha abaixo funciona junto com Google/Discord. Conta social sem senha?
          Use <strong>Criar conta</strong> com o mesmo e-mail para definir uma.
        </p>
      ) : null}
      {clerkEnabled && tab === "login" ? <ClerkSignInLinks /> : null}
      {tab === "login" ? <LoginForm redirect={redirect} /> : <RegisterForm redirect={redirect} />}
      <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
        <a href="/privacidade">Política de privacidade</a>
        {clerkEnabled ? (
          <>
            {" "}
            · <a href="/sign-in">Login Clerk</a>
            {tab === "register" ? (
              <>
                {" "}
                · <a href="/sign-up">Cadastro Clerk</a>
              </>
            ) : null}
          </>
        ) : null}
      </p>
    </div>
  );
}
