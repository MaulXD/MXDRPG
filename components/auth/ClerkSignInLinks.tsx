"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";

export function ClerkSignInLinks() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
      <p className="vtt-eyebrow" style={{ margin: 0 }}>
        Ou entre com
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <SignInButton mode="modal">
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }}>
            Google / Discord / e-mail
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }}>
            Criar com Clerk
          </button>
        </SignUpButton>
      </div>
    </div>
  );
}
