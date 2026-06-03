import Link from "next/link";
import { getSession } from "@/lib/auth/session";

export default async function MesaIndexPage() {
  const session = await getSession();

  return (
    <div className="page-wrap">
      <h1 className="neon-title">Mesa virtual</h1>
      <p style={{ color: "var(--text-muted)", maxWidth: 560, lineHeight: 1.6 }}>
        O Eldarin é um <strong>VTT próprio</strong> no browser — grid hex, tokens, PA e papéis Admin / Mestre /
        Jogador. Não depende de instalar nada no Foundry.
      </p>
      <Link href="/mesa/demo" className="btn" style={{ marginTop: "1rem" }}>
        Abrir mesa demo
      </Link>
      {!session && (
        <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          <Link href="/entrar">Entrar</Link> para salvar campanhas (em breve).
        </p>
      )}
    </div>
  );
}
