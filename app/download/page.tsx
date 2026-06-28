import Link from "next/link";
import { pageMetadata } from "@/lib/site-metadata";
import "./download.css";

export const metadata = pageMetadata(
  "Download — Assistente do Mestre",
  "Rode a mesa MXDRPG no seu próprio PC. Baixe o assistente, siga os passos e compartilhe o link com os jogadores."
);

const RELEASE_BASE = "https://github.com/MaulXD/MXDRPG/releases/latest/download";

const platforms = [
  {
    id: "mac-silicon",
    name: "Mac",
    sub: "Apple Silicon",
    note: "M1, M2, M3",
    file: "mxdrpg-mestre-mac-silicon",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  {
    id: "mac-intel",
    name: "Mac",
    sub: "Intel",
    note: "2017 ou mais novo",
    file: "mxdrpg-mestre-mac-intel",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  {
    id: "linux",
    name: "Linux",
    sub: "x86-64",
    note: "Ubuntu, Debian, Arch…",
    file: "mxdrpg-mestre-linux",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.504 0C12.136 0 11.763.087 11.398.27 10.1.846 9.37 2.197 8.895 3.48c-.24.66-.394 1.325-.456 1.98-.062.656-.038 1.31.07 1.944.107.634.3 1.245.57 1.814.27.57.614 1.098 1.014 1.572.4.474.85.9 1.337 1.27.487.368 1.012.68 1.562.93.55.25 1.128.44 1.717.565.59.124 1.193.187 1.793.187.6 0 1.202-.063 1.793-.187.589-.125 1.167-.315 1.717-.565.55-.25 1.075-.562 1.562-.93.487-.37.937-.796 1.337-1.27.4-.474.744-1.002 1.014-1.572.27-.57.463-1.18.57-1.814.108-.634.132-1.288.07-1.944-.062-.655-.216-1.32-.456-1.98C18.63 2.197 17.9.846 16.602.27 16.237.087 15.864 0 15.496 0h-2.992zM8.5 6.5c.276 0 .5.224.5.5S8.776 7.5 8.5 7.5 8 7.276 8 7s.224-.5.5-.5zm7 0c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5-.5zM12 9c.552 0 1 .448 1 1s-.448 1-1 1-1-.448-1-1 .448-1 1-1zM5 17c0-2.21 3.134-4 7-4s7 1.79 7 4v1H5v-1z"/>
      </svg>
    ),
  },
] as const;

const steps = [
  { n: "1", label: "Instale o Docker Desktop", note: "gratuito, uma única vez" },
  { n: "2", label: "Abra o assistente baixado", note: "clique duas vezes no arquivo" },
  { n: "3", label: "Siga o assistente na tela", note: "pede o token ngrok na 1ª vez" },
  { n: "4", label: "Mande o link para os jogadores", note: "detectado automaticamente" },
];

export default function DownloadPage() {
  return (
    <div className="page-wrap dl-page">

      {/* ── Cabeçalho ── */}
      <div className="dl-header">
        <p className="eyebrow">Hospedagem local</p>
        <h1 className="display-lg dl-title">Assistente do Mestre</h1>
        <p className="lead dl-lead">
          Rode a mesa no seu próprio PC — sem servidor, sem mensalidade. O assistente
          configura tudo e gera o link para os jogadores em minutos.
        </p>
      </div>

      {/* ── Card Windows (destaque) ── */}
      <div className="glass dl-card-win">
        <div className="dl-win-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
            <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
          </svg>
        </div>
        <div className="dl-win-copy">
          <p className="dl-win-label">Windows 10 / 11</p>
          <p className="dl-win-note">Recomendado para a maioria dos mestres</p>
        </div>
        <a
          href={`${RELEASE_BASE}/mxdrpg-mestre-windows.exe`}
          className="btn btn-primary dl-win-btn"
          download
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Baixar .exe
        </a>
      </div>

      {/* ── Outras plataformas ── */}
      <div className="dl-others">
        {platforms.map((p) => (
          <a
            key={p.id}
            href={`${RELEASE_BASE}/${p.file}`}
            className="glass dl-card-other"
            download
          >
            <span className="dl-other-icon">{p.icon}</span>
            <span className="dl-other-name">{p.name}</span>
            <span className="dl-other-sub">{p.sub}</span>
            <span className="dl-other-note">{p.note}</span>
            <span className="dl-other-dl" aria-label="Baixar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </span>
          </a>
        ))}
      </div>

      <p className="dl-releases-link">
        Todas as versões:{" "}
        <a href="https://github.com/MaulXD/MXDRPG/releases" target="_blank" rel="noopener noreferrer" className="text-link">
          github.com/MaulXD/MXDRPG/releases
        </a>
      </p>

      {/* ── Como funciona ── */}
      <div className="dl-steps">
        <h2 className="dl-steps-title">Como funciona</h2>
        <ol className="dl-steps-list">
          {steps.map((s) => (
            <li key={s.n} className="dl-step">
              <span className="dl-step-num" aria-hidden="true">{s.n}</span>
              <span className="dl-step-label">{s.label}</span>
              <span className="dl-step-note">{s.note}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Requisitos ── */}
      <div className="dl-reqs">
        <h2 className="dl-reqs-title">O que você precisa</h2>
        <div className="dl-reqs-grid">
          <div className="glass dl-req">
            <span className="dl-req-icon" aria-hidden="true">🐳</span>
            <div>
              <p className="dl-req-name">Docker Desktop</p>
              <p className="dl-req-note">
                <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener noreferrer" className="text-link">Baixar grátis</a>
                {" "}— instale uma vez, use sempre
              </p>
            </div>
          </div>
          <div className="glass dl-req">
            <span className="dl-req-icon" aria-hidden="true">🌐</span>
            <div>
              <p className="dl-req-name">Conta ngrok</p>
              <p className="dl-req-note">
                <a href="https://ngrok.com/signup" target="_blank" rel="noopener noreferrer" className="text-link">Criar grátis</a>
                {" "}— sem cartão de crédito
              </p>
            </div>
          </div>
          <div className="glass dl-req">
            <span className="dl-req-icon" aria-hidden="true">💻</span>
            <div>
              <p className="dl-req-name">PC ligado durante a sessão</p>
              <p className="dl-req-note">O servidor roda no seu PC — sem isso, jogadores não acessam</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Guia detalhado ── */}
      <div className="glass dl-guide-link">
        <div>
          <p className="dl-guide-label">Passo a passo detalhado</p>
          <p className="dl-guide-note">Guia interativo com instruções completas e solução de problemas</p>
        </div>
        <Link href="/download/guia" className="btn btn-secondary">
          Ver guia completo
        </Link>
      </div>

    </div>
  );
}
