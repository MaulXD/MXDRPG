"use client";

import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

type Props = { redirect?: string };

export function AuthTabs({ redirect = "" }: Props) {
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
      {tab === "login" ? <LoginForm redirect={redirect} /> : <RegisterForm />}
    </div>
  );
}
