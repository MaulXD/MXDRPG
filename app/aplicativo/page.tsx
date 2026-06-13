import Link from "next/link";
import { InstallAppGuide } from "@/components/pwa/InstallAppGuide";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Instalar aplicativo",
  "Instale o MXDRPG no Chrome, Edge ou na tela inicial do celular."
);

export default function AplicativoPage() {
  return (
    <div className="page-wrap">
      <header className="page-header">
        <p className="eyebrow">
          <Link href="/sistema" style={{ color: "var(--text-muted)" }}>
            ← Sistema
          </Link>
        </p>
        <h1 className="display-lg text-gradient">Instalar Eldarin</h1>
        <p className="lead">
          Baixe o VTT como aplicativo no Chrome — atalho na área de trabalho, sem barra de abas do
          navegador.
        </p>
      </header>

      <InstallAppGuide />
    </div>
  );
}
