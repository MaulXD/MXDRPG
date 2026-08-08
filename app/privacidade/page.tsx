import Link from "next/link";
import { ENTRAR_PATH } from "@/lib/site-paths";
import { pageMetadata } from "@/lib/site-metadata";
import { PrivacidadeConteudo } from "./conteudo";

export const metadata = pageMetadata("Privacidade");

export default function PrivacidadePage() {
  return (
    <div className="page-wrap content-card glass" style={{ maxWidth: 720, padding: "2rem", marginTop: "1rem" }}>
      <header className="page-header" style={{ paddingBottom: "1rem" }}>
        <p className="eyebrow">LGPD</p>
        <h1 className="display-lg">Privacidade</h1>
        <p className="lead">MXDRPG — mesa virtual gratuita.</p>
      </header>

      <PrivacidadeConteudo />

      <p style={{ marginTop: "2rem" }}>
        <Link href={ENTRAR_PATH}>Voltar ao login</Link>
      </p>
    </div>
  );
}
