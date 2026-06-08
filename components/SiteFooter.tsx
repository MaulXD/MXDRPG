import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="glass site-footer">
      <div>
        <strong className="neon-title" style={{ fontSize: "0.95rem" }}>
          ELDARIN
        </strong>
        <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem" }}>VTT tático hex · fantasia</p>
      </div>
      <nav style={{ display: "flex", gap: "1.25rem" }}>
        <Link href="/sistema">Sistema</Link>
        <Link href="/mesa/demo">Mesa demo</Link>
        <Link href="/entrar">Entrar</Link>
        <Link href="/privacidade">Privacidade</Link>
      </nav>
    </footer>
  );
}
