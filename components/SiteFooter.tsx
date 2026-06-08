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
      <nav className="site-footer__nav" aria-label="Links do site">
        <Link href="/sistema">Sistema</Link>
        <Link href="/mesa/demo" prefetch={false}>
          Mesa demo
        </Link>
        <Link href="/sign-in">Entrar</Link>
        <Link href="/privacidade">Privacidade</Link>
      </nav>
    </footer>
  );
}
