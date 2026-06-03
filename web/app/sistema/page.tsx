import Link from "next/link";

export default function SistemaPage() {
  return (
    <div className="page-wrap">
      <header className="page-header">
        <p className="eyebrow">Plataforma</p>
        <h1 className="display-lg text-gradient">Roadmap Eldarin</h1>
        <p className="lead">O que já roda na mesa e o que entra na próxima sprint.</p>
      </header>

      <div className="grid-2">
        <article className="glass feature-card">
          <div className="feature-icon">✓</div>
          <h3>Pronto agora</h3>
          <p>Grid hex canvas, tokens, PA, portais Admin/Mestre/Jogador, login demo.</p>
        </article>
        <article className="glass feature-card">
          <div className="feature-icon">→</div>
          <h3>Em breve</h3>
          <p>Multiplayer WebSocket, fichas persistentes, fog of war, pipeline VFX.</p>
        </article>
        <article className="glass feature-card">
          <div className="feature-icon">⚔</div>
          <h3>Combate</h3>
          <p>Alcance hex, rolagens integradas, animações de ataque.</p>
        </article>
        <article className="glass feature-card">
          <div className="feature-icon">◇</div>
          <h3>Assets</h3>
          <p>Suporte a tokens e props 3D exportados do Blender.</p>
        </article>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <Link href="/mesa/demo" className="btn">
          Testar mesa demo
        </Link>
      </div>
    </div>
  );
}
