import Link from "next/link";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import { ENTRAR_PATH } from "@/lib/site-paths";
import { HomeFeatureIcon, type HomeFeatureIconName } from "@/components/ui/EldarinIcons";
import { RPG_SYSTEMS } from "@/lib/rpg/systems";
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
    text: "Movimento com faixas visuais e regras do sistema aplicadas automaticamente — cada RPG com sua própria economia de ações.",
  },
  {
    icon: "diamond",
    slug: "visual",
    title: "Visual medieval",
    text: "Pergaminho, pedra e bronze — identidade visual consistente, sem neon futurista.",
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

      {/* Grid */}
      <g stroke="#242018" strokeWidth="1">
        {[32,64,96,128,160,192,224,256,288,320,352,384].map(x => (
          <line key={x} x1={x} y1="4" x2={x} y2="196" />
        ))}
        {[32,64,96,128,160,192].map(y => (
          <line key={y} x1="4" y1={y} x2="416" y2={y} />
        ))}
      </g>

      {/* Célula ativa */}
      <rect x="97" y="65" width="32" height="32" rx="2" fill="#8B7BB8" fillOpacity="0.12" stroke="#8B7BB8" strokeWidth="1" strokeOpacity="0.4" />

      {/* Linha de ataque */}
      <line x1="129" y1="81" x2="255" y2="81" stroke="#d4b84a" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.55" />

      {/* Token herói */}
      <circle cx="113" cy="81" r="13" fill="#0e1524" stroke="#4a90d9" strokeWidth="2" />
      <text x="113" y="86" textAnchor="middle" fill="#4a90d9" fontSize="11" fontWeight="700" fontFamily="ui-sans-serif,system-ui,sans-serif">G</text>
      <rect x="97" y="60" width="32" height="4" rx="2" fill="#1a1813" />
      <rect x="97" y="60" width="28" height="4" rx="2" fill="#4a9e6c" />

      {/* Token monstro */}
      <circle cx="271" cy="81" r="13" fill="#1c1508" stroke="#d4b84a" strokeWidth="2" />
      <text x="271" y="86" textAnchor="middle" fill="#d4b84a" fontSize="10" fontWeight="700" fontFamily="ui-sans-serif,system-ui,sans-serif">M</text>
      <rect x="255" y="60" width="32" height="4" rx="2" fill="#1a1813" />
      <rect x="255" y="60" width="8" height="4" rx="2" fill="#e05040" />

      {/* Token aliado */}
      <circle cx="113" cy="145" r="11" fill="#0e1524" stroke="#4a90d9" strokeWidth="1.5" opacity="0.6" />
      <text x="113" y="150" textAnchor="middle" fill="#4a90d9" fontSize="9" fontWeight="700" fontFamily="ui-sans-serif,system-ui,sans-serif" opacity="0.7">A</text>

      {/* Marca de impacto */}
      <circle cx="262" cy="72" r="7" fill="none" stroke="#e05040" strokeWidth="1.5" opacity="0.9" />
      <line x1="258" y1="68" x2="266" y2="76" stroke="#e05040" strokeWidth="1.5" opacity="0.9" />
      <line x1="266" y1="68" x2="258" y2="76" stroke="#e05040" strokeWidth="1.5" opacity="0.9" />

      {/* Painel de dados */}
      <rect x="298" y="28" width="112" height="82" rx="6" fill="#16140f" stroke="#8B7BB8" strokeWidth="1.5" />
      <rect x="298" y="28" width="112" height="22" rx="6" fill="#8B7BB8" fillOpacity="0.18" />
      <rect x="298" y="40" width="112" height="10" fill="#8B7BB8" fillOpacity="0.18" />
      <text x="354" y="43" textAnchor="middle" fill="#b0a0d4" fontSize="9" fontWeight="600" fontFamily="ui-sans-serif,system-ui,sans-serif" letterSpacing="0.08em">ATAQUE d20</text>
      <text x="330" y="74" textAnchor="middle" fill="#e8e2d8" fontSize="26" fontWeight="700" fontFamily="ui-monospace,monospace">18</text>
      <rect x="310" y="78" width="38" height="14" rx="3" fill="#4a9e6c" fillOpacity="0.2" />
      <text x="329" y="88" textAnchor="middle" fill="#4a9e6c" fontSize="8" fontWeight="700" fontFamily="ui-sans-serif,system-ui,sans-serif" letterSpacing="0.1em">ACERTO</text>
      <text x="378" y="74" textAnchor="middle" fill="#e05040" fontSize="20" fontWeight="700" fontFamily="ui-monospace,monospace">7</text>
      <text x="378" y="86" textAnchor="middle" fill="#e05040" fontSize="7.5" fontFamily="ui-sans-serif,system-ui,sans-serif" opacity="0.8">DANO</text>
      <line x1="356" y1="52" x2="356" y2="100" stroke="#2e2b24" strokeWidth="1" />

      {/* PA bar */}
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
      {/* ── Hero ── */}
      <section className="page-wrap page-hero page-hero--landing">
        <div className="landing-hero">
          <h1 className="landing-hero__brand">
            <EldarinLogo variant="full" href={null} image="landing" className="eldarin-logo--hero" />
          </h1>
          <p className="eyebrow landing-hero__eyebrow">Hub de VTTs proprietário</p>
          <p className="lead landing-hero__lead">
            Mesa virtual tática com grid, fichas de personagem e chat de dados — direto no
            navegador, sem instalação. Cada sistema de RPG com sua própria ficha e suas próprias
            regras de combate.
          </p>
          <div className="hero-actions landing-hero__actions">
            <Link href={ENTRAR_PATH} className="btn btn-primary landing-cta-primary">
              Entrar e jogar
            </Link>
          </div>

          <ul className="landing-hero__systems" aria-label="Sistemas de RPG disponíveis">
            {RPG_SYSTEMS.filter((s) => s.available).map((s) => (
              <li key={s.id}>
                <Link href={s.href ?? "/mesas"} className="landing-hero__system-chip">
                  {s.name}
                  <span>{s.tagline}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="landing-preview" aria-hidden="true">
            <VttPreview />
          </div>
          <p className="landing-preview__caption">Exemplo: combate tático do sistema Eldarin</p>

          <a href="#recursos" className="landing-scroll-hint" aria-label="Ver mais">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </a>
        </div>
      </section>

      {/* ── Recursos ── */}
      <section id="recursos" className="page-wrap section">
        <p className="eyebrow">Recursos</p>
        <h2 className="display-lg">Construído para mesa séria</h2>
        <p className="lead" style={{ marginBottom: "2rem" }}>
          Do movimento no mapa à ficha do personagem — tudo pensado para RPG tático.
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

      {/* ── Download / Mestre ── */}
      <section className="page-wrap section-tight">
        <div className="glass download-band">
          <div className="download-band__copy">
            <p className="eyebrow">Para o Mestre</p>
            <h2 className="display-lg">Rode a mesa no seu PC</h2>
            <p className="lead">
              Baixe o assistente, abra e a mesa sobe automaticamente — Docker incluso,
              link público gerado na hora. Sem conta em servidor, sem mensalidade.
            </p>
          </div>
          <div className="download-band__actions">
            <a
              href="https://github.com/MaulXD/MXDRPG/releases/latest/download/mxdrpg-mestre-windows.exe"
              className="btn btn-primary btn--download"
              download
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Baixar para Windows
            </a>
            <div className="download-other">
              <Link href="/download" className="download-other__link">Todas as plataformas</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
