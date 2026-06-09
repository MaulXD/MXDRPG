import Link from "next/link";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
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
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">VTT proprietário</p>
            <h1 className="display-xl" style={{ margin: 0 }}>
              <EldarinLogo variant="full" href={null} className="eldarin-logo--hero" />
            </h1>
            <p className="lead" style={{ marginTop: "1.25rem" }}>
              Sua mesa virtual de fantasia: combaté em hexágonos, pontos de ação e fichas com
              identidade visual única — direto no navegador.
            </p>
            <div className="hero-actions">
              <Link href="/sign-in" className="btn">
                Entrar e jogar
              </Link>
              <Link href="/mesa/demo" prefetch={false} className="btn btn-secondary">
                Demo ao vivo
              </Link>
            </div>
          </div>
          <HexPreview />
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
