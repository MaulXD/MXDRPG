"use client";

import { useState } from "react";
import { ClerkSignInLinks } from "@/components/auth/ClerkSignInLinks";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

type Props = { redirect?: string; clerkEnabled?: boolean };

export function AuthTabs({ redirect = "", clerkEnabled = false }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          type="button"
          className={tab === "login" ? "btn" : "btn btn-secondary"}
          style={{ flex: 1 }}
          onClick={() => setTab("login")}
        >
          Entrar
        </button>
        <button
          type="button"
          className={tab === "register" ? "btn" : "btn btn-secondary"}
          style={{ flex: 1 }}
          onClick={() => setTab("register")}
        >
          Criar conta
        </button>
      </div>
      {clerkEnabled && tab === "login" ? <ClerkSignInLinks /> : null}
      {tab === "login" ? <LoginForm redirect={redirect} /> : <RegisterForm />}
      <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
        <a href="/privacidade">Política de privacidade</a>
        {clerkEnabled ? (
          <>
            {" "}
            · <a href="/sign-in">Login Clerk (página)</a>
          </>
        ) : null}
      </p>
    </div>
  );
}
