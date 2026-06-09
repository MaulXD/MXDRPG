import Link from "next/link";
import { IconMiss, IconSword } from "@/components/ui/EldarinIcons";
import { MedievalFrame, MEDIEVAL_FRAME_VARIANTS, type MedievalFrameVariant } from "@/components/ui/MedievalFrame";

const LIVE = [
  "Mesa hex ao vivo com sync SSE (fallback poll)",
  "Combate: PA, movimento, ataque, habilidade, magias de área (cone/linha)",
  "Preview no mapa: PA, alcance, vantagem/desvantagem",
  "Iniciativa, condições, spawn do bestiário (69 espécies)",
  "Wizard de ficha (8 passos, com religião) e compêndios sincronizados do livro",
  "Atlas e panteão em /mundo — lore com tooltips",
  "Convite de sala + modo visitante (só leitura)",
  "Login Clerk + apelido (opcional) ou demo local",
];

const NEXT = [
  "Persistência Neon em produção (salas e fichas na nuvem)",
  "Delegação explícita de token entre jogadores",
  "Névoa de guerra e macros",
];

const BORDER_LABELS: Record<MedievalFrameVariant, string> = {
  parchment: "Pergaminho",
  iron: "Ferro forjado",
  gothic: "Gótico",
  royal: "Real",
  celtic: "Celta",
  rune: "Runas / escriba",
};

const BORDER_HINTS: Record<MedievalFrameVariant, string> = {
  parchment: "Hub de aventura, tom de carta antiga",
  iron: "Lista de mesas, aro pesado com rebites",
  gothic: "Ficha pop-up na mesa, cantos angulares",
  royal: "Seleção de RPG, filete nobre",
  celtic: "Painéis decorativos, traço entrelaçado",
  rune: "Ficha em página, cantos em L",
};

export default function SistemaPage() {
  return (
    <div className="page-wrap">
      <header className="page-header">
        <p className="eyebrow">Plataforma</p>
        <h1 className="display-lg text-gradient">Eldarin VTT</h1>
        <p className="lead">
          Mesa tática online alinhada ao livro Eldarin v4 — o que já está jogável e o que vem na sequência.
        </p>
      </header>

      <MedievalFrame variant="celtic" page>
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Bordas medievais</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.55, marginTop: 0 }}>
            Seis molduras para páginas abertas. Use a classe{" "}
            <code>mf mf--parchment</code> ou o componente{" "}
            <code>&lt;MedievalFrame variant=&quot;iron&quot;&gt;</code>.
          </p>
          <div className="mf-gallery">
            {MEDIEVAL_FRAME_VARIANTS.map((variant) => (
              <div key={variant} className="mf-gallery__item">
                <p className="mf-gallery__label">{BORDER_LABELS[variant]}</p>
                <MedievalFrame variant={variant} compact>
                  <div className="mf-gallery__sample">
                    <strong>{BORDER_LABELS[variant]}</strong>
                    <br />
                    {BORDER_HINTS[variant]}
                  </div>
                </MedievalFrame>
              </div>
            ))}
          </div>
        </section>
      </MedievalFrame>

      <section className="glass" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Jogável agora</h2>
        <ul className="roadmap-list roadmap-list--live">
          {LIVE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="glass" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Em seguida</h2>
        <ul className="roadmap-list roadmap-list--pending">
          {NEXT.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="grid-2">
        <article className="glass feature-card">
          <div className="feature-icon">
            <IconSword size={28} />
          </div>
          <h3>Combate</h3>
          <p>
            Motor com PA (acúmulo, teto, stun), saves, áreas burst/wall/cone/line. HUD no canto do mapa.
          </p>
        </article>
        <article className="glass feature-card">
          <div className="feature-icon">
            <IconMiss size={28} />
          </div>
          <h3>Dados</h3>
          <p>
            <code>npm run sync:data</code> gera monstros, magias e habilidades a partir do livro.
          </p>
        </article>
      </div>

      <div className="action-row" style={{ marginTop: "2rem" }}>
        <Link href="/mesa/demo" prefetch={false} className="btn">
          Mesa demo
        </Link>
        <Link href="/personagem/novo" className="btn btn-ghost">
          Nova ficha
        </Link>
        <Link href="/eldarin" className="btn btn-ghost">
          Suas mesas
        </Link>
        <Link href="/mundo" className="btn btn-ghost">
          Atlas e panteão
        </Link>
      </div>
    </div>
  );
}
