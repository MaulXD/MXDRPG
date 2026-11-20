"use client";

import { useState } from "react";
import "./auth-forms.css";
import { OAuthSignInButtons } from "@/components/auth/OAuthSignInButtons";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import type { OAuthProviderId } from "@/lib/auth/oauth-config";

type Props = {
  redirect?: string;
  initialTab?: "login" | "register";
  oauthProviders?: OAuthProviderId[];
  persistentAccounts?: boolean;
};

export function AuthTabs({
  redirect = "",
  initialTab = "login",
  oauthProviders = [],
  persistentAccounts = true,
}: Props) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  // Sem contas persistentes, nao ha cadastro: a aba Criar conta some e fica so Entrar.
  const podeCadastrar = persistentAccounts;
  const tabAtiva = podeCadastrar ? tab : "login";

  return (
    <div>
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tabs__btn ${tabAtiva === "login" ? "btn" : "btn btn-secondary"}`}
          onClick={() => setTab("login")}
        >
          Entrar
        </button>
        {podeCadastrar ? (
          <button
            type="button"
            className={`auth-tabs__btn ${tabAtiva === "register" ? "btn" : "btn btn-secondary"}`}
            onClick={() => setTab("register")}
          >
            Criar conta
          </button>
        ) : null}
      </div>
      {oauthProviders.length > 0 ? (
        <OAuthSignInButtons
          redirect={redirect}
          providers={oauthProviders}
          mode={tabAtiva === "register" ? "register" : "login"}
        />
      ) : null}
      {oauthProviders.length > 0 ? (
        <p className="auth-form__divider" aria-hidden>
          ou
        </p>
      ) : null}
      {tabAtiva === "login" ? (
        <LoginForm redirect={redirect} />
      ) : (
        <RegisterForm redirect={redirect} persistentAccounts={persistentAccounts} />
      )}
      <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
        <a href="/privacidade">Política de privacidade</a>
      </p>
    </div>
  );
}
