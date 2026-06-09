import Image from "next/image";
import Link from "next/link";
import { BRAND_LANDING } from "@/components/brand/EldarinLogo";
import { HexPreview } from "@/components/home/HexPreview";
import { HomeFeatureIcon, type HomeFeatureIconName } from "@/components/ui/EldarinIcons";

const features: Array<{ icon: HomeFeatureIconName; title: string; text: string }> = [
  {
    icon: "hex",
    title: "VTT no navegador",
    text: "Mesa virtual própria — zero instalação, zero dependência de apps de terceiros.",
  },
  {
    icon: "target",
    title: "Grid hexagonal",
    text: "Movimento tático com faixas visuais: caminhada verde, corrida âmbar, PA automático.",
  },
  {
    icon: "diamond",
    title: "Visual medieval",
    text: "Pergaminho, pedra e bronze — tema claro ou escuro, sem neon futurista.",
  },
  {
    icon: "sword",
    title: "Papéis de mesa",
    text: "Admin, Mestre e Jogador — cada um com painel e permissões claras.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="page-wrap page-hero">
        <div className="landing-hero">
          <h1 className="landing-hero__brand">
            <Image
              src={BRAND_LANDING}
              alt="MXDRPG"
              width={640}
              height={935}
              className="landing-hero__logo"
              priority
              sizes="(max-width: 768px) 92vw, 28rem"
            />
          </h1>
          <p className="eyebrow landing-hero__eyebrow">VTT proprietário</p>
          <p className="lead landing-hero__lead">
            Sua mesa virtual de fantasia: combaté em hexágonos, pontos de ação e fichas com
            identidade visual única — direto no navegador.
          </p>
          <div className="hero-actions landing-hero__actions">
            <Link href="/sign-in" className="btn">
              Entrar e jogar
            </Link>
            <Link href="/mesa/demo" prefetch={false} className="btn btn-secondary">
              Demo ao vivo
            </Link>
          </div>
          <div className="landing-hero__visual" aria-hidden>
            <HexPreview />
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
            <div className="stat-label">Combaté por turnos</div>
          </div>
          <div>
            <div className="stat-value">3</div>
            <div className="stat-label">Papéis de acesso</div>
          </div>
          <div>
            <div className="stat-value">100%</div>
            <div className="stat-label">Web</div>
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
            <article key={f.title} className="glass feature-card">
              <div className="feature-icon">
                <HomeFeatureIcon name={f.icon} size={28} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-wrap">
        <div className="glass cta-band">
          <h2 className="display-lg">Pronto para a masmorra?</h2>
          <p className="lead" style={{ margin: "0 auto 1.5rem", textAlign: "center", maxWidth: "28rem" }}>
            Abra a mesa demo, arraste tokens e teste caminhada vs corrida em segundos.
          </p>
          <Link href="/mesa/demo" prefetch={false} className="btn">
            Abrir mesa hex
          </Link>
        </div>
      </section>
    </>
  );
}
