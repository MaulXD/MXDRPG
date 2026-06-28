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
            <Link href={ENTRAR_PATH} className="btn btn-primary">
              Entrar e jogar
            </Link>
            <Link href="/mesa/demo" prefetch={false} className="btn btn-secondary">
              Demo ao vivo
            </Link>
          </div>
        </div>
      </section>

      <section className="page-wrap section-tight">
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
