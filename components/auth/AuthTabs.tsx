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
};

export function AuthTabs({
  redirect = "",
  initialTab = "login",
  oauthProviders = [],
}: Props) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);

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
      {oauthProviders.length > 0 && tab === "login" ? (
        <OAuthSignInButtons redirect={redirect} providers={oauthProviders} />
      ) : null}
      {tab === "login" ? <LoginForm redirect={redirect} /> : <RegisterForm redirect={redirect} />}
      <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
        <a href="/privacidade">Política de privacidade</a>
      </p>
    </div>
  );
}
