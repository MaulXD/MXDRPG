import Link from "next/link";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import { SITE_NAME } from "@/lib/site-metadata";

export function SiteFooter() {
  return (
    <footer className="glass site-footer">
      <div>
        <EldarinLogo variant="full" href="/" className="eldarin-logo--footer" />
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem" }}>{SITE_NAME} · VTT tático</p>
      </div>
      <nav className="site-footer__nav" aria-label="Links do site">
        <Link href="/sistema">Sistema</Link>
        <Link href="/mesa/demo" prefetch={false}>
          Mesa demo
        </Link>
        <Link href="/sign-in">Entrar</Link>
        <Link href="/aplicativo">Instalar app</Link>
        <Link href="/privacidade">Privacidade</Link>
      </nav>
    </footer>
  );
}
