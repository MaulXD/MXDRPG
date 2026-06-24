import Link from "next/link";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import { ENTRAR_PATH } from "@/lib/site-paths";
import { HomeFeatureIcon, type HomeFeatureIconName } from "@/components/ui/EldarinIcons";
import { HeroVttPreview } from "@/components/home/HeroVttPreview";
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
    title: "Zero instalação",
    text: "Abre no navegador — Chrome, Safari, Firefox. Sem plugin, sem download, sem conta em app de terceiro.",
  },
  {
    icon: "move",
    slug: "grid",
    title: "Grid que mostra o custo",
    text: "Verde é caminhada, âmbar é corrida. Cada célula consome PA antes de você agir — sem surpresa no turno.",
  },
  {
    icon: "diamond",
    slug: "visual",
    title: "Visual de livro de regras",
    text: "Fichas em pergaminho, chrome de combate escuro. Parece RPG, não planilha — desde o primeiro login.",
  },
  {
    icon: "sword",
    slug: "papeis",
    title: "Papéis com peso real",
    text: "Mestre arbitra e edita. Jogador controla só o próprio personagem. Permissões automáticas, sem configuração.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="page-wrap page-hero page-hero--landing">
        <div className="landing-hero">
          <div className="landing-hero__content">
            <h1 className="landing-hero__brand">
              <EldarinLogo variant="full" href={null} image="landing" className="eldarin-logo--hero" />
            </h1>
            <p className="eyebrow landing-hero__eyebrow">Mesa Virtual · RPG de Fantasia</p>
            <p className="lead landing-hero__lead">
              Grid hexagonal, pontos de ação e fichas medievais — tudo no navegador, sem instalar nada.
            </p>
            <div className="hero-actions landing-hero__actions">
              <Link href={ENTRAR_PATH} className="btn btn-primary">
                Entrar e jogar
              </Link>
              <Link href="/mesa/demo" prefetch={false} className="btn btn-secondary">
                Ver demo ao vivo
              </Link>
            </div>
          </div>
          <div className="landing-hero__visual" aria-hidden="true">
            <HeroVttPreview />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="page-wrap section-tight">
        <div className="landing-stats">
          <div className="landing-stat">
            <span className="landing-stat__value">Hex</span>
            <span className="landing-stat__label">Grid tático</span>
          </div>
          <div className="landing-stat__sep" aria-hidden />
          <div className="landing-stat">
            <span className="landing-stat__value">PA</span>
            <span className="landing-stat__label">Combate por turnos</span>
          </div>
          <div className="landing-stat__sep" aria-hidden />
          <div className="landing-stat">
            <span className="landing-stat__value">3</span>
            <span className="landing-stat__label">Papéis de mesa</span>
          </div>
          <div className="landing-stat__sep" aria-hidden />
          <div className="landing-stat">
            <span className="landing-stat__value">Zero</span>
            <span className="landing-stat__label">Instalação</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="page-wrap section landing-features-section">
        <p className="eyebrow">Recursos</p>
        <h2 className="display-lg">Construído para mesa séria</h2>
        <p className="lead" style={{ marginBottom: "2rem" }}>
          Do movimento no mapa à ficha do personagem — tudo pensado para RPG tático.
        </p>
        <div className="grid-2">
          {features.map((f) => (
            <article key={f.slug} className={`glass feature-card feature-card--${f.slug}`}>
              <div className="feature-card__head">
                <div className="feature-icon">
                  <HomeFeatureIcon name={f.icon} size={20} />
                </div>
                <h3>{f.title}</h3>
              </div>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="page-wrap">
        <div className="glass cta-band cta-band--landing">
          <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>Sem cadastro obrigatório</p>
          <h2 className="display-lg">Pronto para a masmorra?</h2>
          <p className="lead" style={{ margin: "0 auto 1.75rem", textAlign: "center", maxWidth: "26rem" }}>
            Abra a demo, arraste tokens e veja caminhada vs corrida em ação — em menos de um minuto.
          </p>
          <div className="cta-band__actions">
            <Link href="/mesa/demo" prefetch={false} className="btn btn-primary">
              Abrir demo
            </Link>
            <Link href={ENTRAR_PATH} className="btn btn-secondary">
              Criar conta
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
