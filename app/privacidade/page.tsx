import Link from "next/link";
import fs from "fs";
import path from "path";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata("Privacidade");

export default function PrivacidadePage() {
  const mdPath = path.join(process.cwd(), "docs/PRIVACIDADE-LGPD.md");
  let body =
    "Política em atualização. Edite docs/PRIVACIDADE-LGPD.md com e-mail do titular antes do lançamento.";
  try {
    body = fs.readFileSync(mdPath, "utf8");
  } catch {
    /* fallback */
  }

  return (
    <div className="page-wrap content-card glass" style={{ maxWidth: 720, padding: "2rem", marginTop: "1rem" }}>
      <header className="page-header" style={{ paddingBottom: "1rem" }}>
        <p className="eyebrow">LGPD</p>
        <h1 className="display-lg">Privacidade</h1>
        <p className="lead">Eldarin RPG — mesa virtual gratuita.</p>
      </header>
      <article
        style={{
          lineHeight: 1.7,
          color: "var(--text-muted)",
          whiteSpace: "pre-wrap",
          fontSize: "0.9rem",
        }}
      >
        {body}
      </article>
      <p style={{ marginTop: "2rem" }}>
        <Link href="/sign-in">Voltar ao login</Link>
      </p>
    </div>
  );
}
