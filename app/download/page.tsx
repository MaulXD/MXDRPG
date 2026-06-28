import { pageMetadata } from "@/lib/site-metadata";
import "./download.css";

export const metadata = pageMetadata(
  "Download — Assistente do Mestre",
  "Rode a mesa MXDRPG no seu próprio PC. Baixe o assistente, crie conta no ngrok e a mesa sobe automaticamente."
);

const RELEASE_BASE = "https://github.com/MaulXD/MXDRPG/releases/latest/download";

const platforms = [
  { id: "mac-silicon", name: "Mac Silicon", sub: "M1, M2, M3", file: "mxdrpg-mestre-mac-silicon" },
  { id: "mac-intel",   name: "Mac Intel",   sub: "2017 ou +",  file: "mxdrpg-mestre-mac-intel"   },
  { id: "linux",       name: "Linux",        sub: "x86-64",    file: "mxdrpg-mestre-linux"        },
] as const;

const autoSteps = [
  { icon: "🐳", text: "Instala o Docker Desktop se necessário" },
  { icon: "⬇️", text: "Baixa e mantém o MXDRPG atualizado" },
  { icon: "🗄️", text: "Sobe banco de dados e servidor local" },
  { icon: "🔗", text: "Gera link público para os jogadores" },
];

export default function DownloadPage() {
  return (
    <div className="page-wrap dl-page">

      {/* ── Cabeçalho ── */}
      <div className="dl-header">
        <p className="eyebrow">Hospedagem local</p>
        <h1 className="display-lg dl-title">Assistente do Mestre</h1>
        <p className="lead dl-lead">
          Clique duas vezes, siga um passo e a mesa sobe no seu PC — sem mensalidade, sem servidor.
        </p>
      </div>

      {/* ── Card Windows ── */}
      <div className="glass dl-card-win">
        <div className="dl-win-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" width="44" height="44">
            <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
          </svg>
        </div>
        <div className="dl-win-copy">
          <p className="dl-win-label">Windows 10 / 11</p>
          <p className="dl-win-note">Recomendado · 64-bit</p>
        </div>
        <a href={`${RELEASE_BASE}/mxdrpg-mestre-windows.exe`} className="btn btn-primary dl-win-btn" download>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          <a key={p.id} href={`${RELEASE_BASE}/${p.file}`} className="glass dl-card-other" download>
            <span className="dl-other-name">{p.name}</span>
            <span className="dl-other-sub">{p.sub}</span>
            <span className="dl-other-dl" aria-label="Baixar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </span>
          </a>
        ))}
      </div>

      {/* ── Separador ── */}
      <div className="dl-divider" />

      {/* ── Bloco principal: ngrok + automático lado a lado ── */}
      <div className="dl-setup">

        {/* Antes de começar — ngrok */}
        <div className="glass dl-setup-card dl-setup-ngrok">
          <div className="dl-setup-header">
            <span className="dl-setup-badge">1 passo manual</span>
            <h2 className="dl-setup-title">Criar conta no ngrok</h2>
          </div>
          <p className="dl-setup-desc">
            O ngrok gera o link público para os jogadores acessarem. É gratuito e sem cartão.
          </p>
          <ol className="dl-ngrok-steps">
            <li>
              <a href="https://ngrok.com/signup" target="_blank" rel="noopener noreferrer" className="dl-ngrok-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Criar conta em ngrok.com
              </a>
            </li>
            <li>Acesse <strong>Dashboard → Your Authtoken</strong></li>
            <li>Copie o token — o assistente vai pedir na 1ª execução</li>
          </ol>
          <p className="dl-setup-note">
            Não precisa fazer isso de novo nas próximas sessões.
          </p>
        </div>

        {/* O assistente faz o resto */}
        <div className="glass dl-setup-card dl-setup-auto">
          <div className="dl-setup-header">
            <span className="dl-setup-badge dl-setup-badge--auto">automático</span>
            <h2 className="dl-setup-title">O assistente cuida do resto</h2>
          </div>
          <p className="dl-setup-desc">
            Abra o arquivo baixado e ele configura tudo sozinho:
          </p>
          <ul className="dl-auto-list">
            {autoSteps.map((s) => (
              <li key={s.text} className="dl-auto-item">
                <span className="dl-auto-icon" aria-hidden="true">{s.icon}</span>
                <span>{s.text}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* ── Resultado ── */}
      <div className="dl-result">
        <div className="dl-result-icon" aria-hidden="true">🎲</div>
        <div>
          <p className="dl-result-title">Mesa pronta</p>
          <p className="dl-result-desc">
            O link dos jogadores aparece automaticamente na tela. Mande no grupo e joguem.
          </p>
        </div>
      </div>

      {/* ── Nota Mac/Linux ── */}
      <p className="dl-platform-note">
        Mac e Linux: após baixar, rode <code>chmod +x mxdrpg-mestre-*</code> no terminal antes de abrir.
      </p>

    </div>
  );
}
