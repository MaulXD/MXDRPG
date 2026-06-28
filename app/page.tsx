import Link from "next/link";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import { ENTRAR_PATH } from "@/lib/site-paths";
import { HomeFeatureIcon, type HomeFeatureIconName } from "@/components/ui/EldarinIcons";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata("Seu HUB RPG");

const features: Array<{
  icon: HomeFeatureIconName;
  slug: "vtt" | "grid" | "visual" | "papeis";
  title: string;
  text: string;
}> = [
  {
    icon: "target",
    slug: "vtt",
    title: "VTT no navegador",
    text: "Mesa virtual própria — zero instalação, zero dependência de apps de terceiros.",
  },
  {
    icon: "move",
    slug: "grid",
    title: "Grid tático",
    text: "Movimento tático com faixas visuais: caminhada verde, corrida âmbar, PA automático.",
  },
  {
    icon: "diamond",
    slug: "visual",
    title: "Visual medieval",
    text: "Pergaminho, pedra e bronze — visual medieval escuro, sem neon futurista.",
  },
  {
    icon: "sword",
    slug: "papeis",
    title: "Papéis de mesa",
    text: "Admin, Mestre e Jogador — cada um com painel e permissões claras.",
  },
];

function VttPreview() {
  return (
    <svg
      viewBox="0 0 420 200"
      xmlns="http://www.w3.org/2000/svg"
      className="landing-preview__svg"
      role="img"
      aria-label="Preview do VTT — grid tático com tokens e painel de combate"
    >
      {/* Fundo */}
      <rect width="420" height="200" rx="8" fill="#0e0d0b" />

      {/* Grid — 12 colunas × 6 linhas de 32px */}
      <g stroke="#242018" strokeWidth="1">
        {[32,64,96,128,160,192,224,256,288,320,352,384].map(x => (
          <line key={x} x1={x} y1="4" x2={x} y2="196" />
        ))}
        {[32,64,96,128,160,192].map(y => (
          <line key={y} x1="4" y1={y} x2="416" y2={y} />
        ))}
      </g>

      {/* Célula ativa (atacante) */}
      <rect x="97" y="65" width="32" height="32" rx="2" fill="#8B7BB8" fillOpacity="0.12" stroke="#8B7BB8" strokeWidth="1" strokeOpacity="0.4" />

      {/* Linha de ataque */}
      <line x1="129" y1="81" x2="255" y2="81" stroke="#d4b84a" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.55" />

      {/* Token herói (azul) */}
      <circle cx="113" cy="81" r="13" fill="#0e1524" stroke="#4a90d9" strokeWidth="2" />
      <text x="113" y="86" textAnchor="middle" fill="#4a90d9" fontSize="11" fontWeight="700" fontFamily="ui-sans-serif,system-ui,sans-serif">G</text>
      {/* HP bar herói */}
      <rect x="97" y="60" width="32" height="4" rx="2" fill="#1a1813" />
      <rect x="97" y="60" width="28" height="4" rx="2" fill="#4a9e6c" />

      {/* Token monstro (âmbar) */}
      <circle cx="271" cy="81" r="13" fill="#1c1508" stroke="#d4b84a" strokeWidth="2" />
      <text x="271" y="86" textAnchor="middle" fill="#d4b84a" fontSize="10" fontWeight="700" fontFamily="ui-sans-serif,system-ui,sans-serif">M</text>
      {/* HP bar monstro — quase vazio */}
      <rect x="255" y="60" width="32" height="4" rx="2" fill="#1a1813" />
      <rect x="255" y="60" width="8" height="4" rx="2" fill="#e05040" />

      {/* Token aliado */}
      <circle cx="113" cy="145" r="11" fill="#0e1524" stroke="#4a90d9" strokeWidth="1.5" opacity="0.6" />
      <text x="113" y="150" textAnchor="middle" fill="#4a90d9" fontSize="9" fontWeight="700" fontFamily="ui-sans-serif,system-ui,sans-serif" opacity="0.7">A</text>

      {/* Marca de impacto no monstro */}
      <circle cx="262" cy="72" r="7" fill="none" stroke="#e05040" strokeWidth="1.5" opacity="0.9" />
      <line x1="258" y1="68" x2="266" y2="76" stroke="#e05040" strokeWidth="1.5" opacity="0.9" />
      <line x1="266" y1="68" x2="258" y2="76" stroke="#e05040" strokeWidth="1.5" opacity="0.9" />

      {/* Painel de dados (floating) */}
      <rect x="298" y="28" width="112" height="82" rx="6" fill="#16140f" stroke="#8B7BB8" strokeWidth="1.5" />
      {/* Cabeçalho do painel */}
      <rect x="298" y="28" width="112" height="22" rx="6" fill="#8B7BB8" fillOpacity="0.18" />
      <rect x="298" y="40" width="112" height="10" fill="#8B7BB8" fillOpacity="0.18" />
      <text x="354" y="43" textAnchor="middle" fill="#b0a0d4" fontSize="9" fontWeight="600" fontFamily="ui-sans-serif,system-ui,sans-serif" letterSpacing="0.08em">ATAQUE d20</text>
      {/* Número do dado */}
      <text x="330" y="74" textAnchor="middle" fill="#e8e2d8" fontSize="26" fontWeight="700" fontFamily="ui-monospace,monospace">18</text>
      {/* Label acerto */}
      <rect x="310" y="78" width="38" height="14" rx="3" fill="#4a9e6c" fillOpacity="0.2" />
      <text x="329" y="88" textAnchor="middle" fill="#4a9e6c" fontSize="8" fontWeight="700" fontFamily="ui-sans-serif,system-ui,sans-serif" letterSpacing="0.1em">ACERTO</text>
      {/* Dano */}
      <text x="378" y="74" textAnchor="middle" fill="#e05040" fontSize="20" fontWeight="700" fontFamily="ui-monospace,monospace">7</text>
      <text x="378" y="86" textAnchor="middle" fill="#e05040" fontSize="7.5" fontFamily="ui-sans-serif,system-ui,sans-serif" opacity="0.8">DANO</text>
      {/* Divisor */}
      <line x1="356" y1="52" x2="356" y2="100" stroke="#2e2b24" strokeWidth="1" />

      {/* PA (pontos de ação) — barra de indicadores */}
      <rect x="6" y="178" width="408" height="16" rx="4" fill="#16140f" stroke="#242018" strokeWidth="1" />
      <text x="14" y="189" fill="#6e6458" fontSize="7.5" fontFamily="ui-sans-serif,system-ui,sans-serif" letterSpacing="0.08em">PA</text>
      {[28,38,48,58].map((x) => (
        <rect key={x} x={x} y="182" width="7" height="7" rx="1.5" fill="#8B7BB8" fillOpacity="0.8" />
      ))}
      {[68,78].map((x) => (
        <rect key={x} x={x} y="182" width="7" height="7" rx="1.5" fill="#2e2b24" />
      ))}
      <text x="106" y="189" fill="#6e6458" fontSize="7.5" fontFamily="ui-sans-serif,system-ui,sans-serif">·  TURNO 3  ·  GRIMLOCK</text>
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="page-wrap page-hero page-hero--landing">
        <div className="landing-hero">
          <h1 className="landing-hero__brand">
            <EldarinLogo variant="full" href={null} image="landing" className="eldarin-logo--hero" />
          </h1>
          <p className="eyebrow landing-hero__eyebrow">VTT proprietário</p>
          <p className="lead landing-hero__lead">
            Sua mesa virtual de fantasia: combate tático em grid, pontos de ação e fichas com
            identidade visual única — direto no navegador.
          </p>
          <div className="hero-actions landing-hero__actions">
            <Link href={ENTRAR_PATH} className="btn btn-primary landing-cta-primary">
              Entrar e jogar
            </Link>
            <Link href="/mesa/demo" prefetch={false} className="btn btn-secondary">
              Demo ao vivo
            </Link>
          </div>

          <div className="landing-preview" aria-hidden="true">
            <VttPreview />
          </div>

          <a href="#features" className="landing-scroll-hint" aria-label="Ver mais">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </a>
        </div>
      </section>

      <section id="features" className="page-wrap section-tight">
        <div className="glass stats-strip">
          <div>
            <div className="stat-value">Hex</div>
            <div className="stat-label">Grid tático</div>
          </div>
          <div>
            <div className="stat-value">PA</div>
            <div className="stat-label">Combate por turnos</div>
          </div>
          <div>
            <div className="stat-value">3</div>
            <div className="stat-label">Papéis de mesa</div>
          </div>
          <div>
            <div className="stat-value">Zero</div>
            <div className="stat-label">Instalação necessária</div>
          </div>
        </div>
      </section>

      <section className="page-wrap section">
        <p className="eyebrow">Recursos</p>
        <h2 className="display-lg">Construído para mesa séria</h2>
        <p className="lead" style={{ marginBottom: "2rem" }}>
          Do movimento no mapa à ficha do personagem — tudo pensado para RPG tático em masmorra.
        </p>
        <div className="grid-2">
          {features.map((f) => (
            <article key={f.title} className={`glass feature-card feature-card--${f.slug}`}>
              <div className="feature-icon">
                <HomeFeatureIcon name={f.icon} size={28} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-wrap section-tight">
        <div className="glass download-band">
          <div className="download-band__copy">
            <p className="eyebrow">Para o Mestre</p>
            <h2 className="display-lg">Rode a mesa no seu PC</h2>
            <p className="lead">
              Baixe o assistente, clique duas vezes e a mesa sobe com túnel automático para
              os jogadores — sem conta em servidor, sem mensalidade.
            </p>
          </div>
          <div className="download-band__actions">
            <a
              href="https://github.com/MaulXD/MXDRPG/releases/latest/download/mxdrpg-mestre-windows.exe"
              className="btn btn-primary btn--download"
              download
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Baixar para Windows
            </a>
            <div className="download-other">
              <Link href="/download" className="download-other__link">Todas as plataformas</Link>
              <span className="download-other__sep" aria-hidden="true">·</span>
              <Link href="/download/guia" className="download-other__link">Ver guia</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="page-wrap">
        <div className="glass cta-band cta-band--landing">
          <h2 className="display-lg">Pronto para a masmorra?</h2>
          <p className="lead" style={{ margin: "0 auto 1.5rem", textAlign: "center", maxWidth: "28rem" }}>
            Abra a mesa demo, arraste tokens e teste caminhada vs corrida em segundos.
          </p>
          <Link href="/mesa/demo" prefetch={false} className="btn btn-primary">
            Abrir mesa demo
          </Link>
        </div>
      </section>
    </>
  );
}
