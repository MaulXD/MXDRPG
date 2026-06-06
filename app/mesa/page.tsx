import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function MesaIndexPage() {
  const session = await getSession();
  if (session) redirect("/eldarin");

  return (
    <div className="page-wrap">
      <h1 className="neon-title">Mesa virtual</h1>
      <p style={{ color: "var(--text-muted)", maxWidth: 560, lineHeight: 1.6 }}>
        Grade hexagonal, tokens, PA e combaté Eldarin no navegador. Crie conta, abra sua mesa e convide o grupo com
        código de sala.
      </p>
      <Link href="/mesa/demo" className="btn" style={{ marginTop: "1rem" }}>
        Mesa demo (pública)
      </Link>
      <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
        <Link href="/entrar">Criar conta</Link> · <Link href="/painel">Painel</Link>
      </p>
    </div>
  );
}
