import Link from "next/link";
import { getSession } from "@/lib/auth/session";

export default async function MesaIndexPage() {
  const session = await getSession();

  return (
    <div className="page-wrap">
      <h1 className="neon-title">Mesa virtual</h1>
      <p style={{ color: "var(--text-muted)", maxWidth: 560, lineHeight: 1.6 }}>
        Grade hexagonal, tokens, PA e combaté Eldarin no navegador. Experimente a demo pública ou crie sua mesa com
        conta.
      </p>
      <div className="action-row" style={{ marginTop: "1rem" }}>
        <Link href="/mesa/demo" prefetch={false} className="btn">
          Mesa demo (pública)
        </Link>
        {session ? (
          <Link href="/mesas" className="btn btn-secondary">
            Hub de mesas
          </Link>
        ) : (
          <Link href="/sign-in" className="btn btn-secondary">
            Criar conta
          </Link>
        )}
      </div>
      {!session ? (
        <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Já tem conta? <Link href="/sign-in">Entrar</Link>
        </p>
      ) : null}
    </div>
  );
}
