import Link from "next/link";
import { ENTRAR_PATH, ELDARIN_MESAS_PATH, MESAS_HUB_PATH } from "@/lib/site-paths";
import { getSession } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata("Mesa virtual");

export default async function MesaIndexPage() {
  const session = await getSession();

  return (
    <div className="page-wrap">
      <h1 className="neon-title">Mesa virtual</h1>
      <p style={{ color: "var(--text-muted)", maxWidth: 560, lineHeight: 1.6 }}>
        Grade quadrada, tokens, PA e combate Eldarin no navegador. Crie sua mesa com conta.
      </p>
      <div className="action-row" style={{ marginTop: "1rem" }}>
        {session ? (
          <Link href="/mesas" className="btn btn-secondary">
            Hub de mesas
          </Link>
        ) : (
          <Link href={ENTRAR_PATH} className="btn btn-secondary">
            Criar conta
          </Link>
        )}
      </div>
      {!session ? (
        <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Já tem conta? <Link href={ENTRAR_PATH}>Entrar</Link>
        </p>
      ) : null}
    </div>
  );
}
