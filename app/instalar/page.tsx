import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata("Implantação");

export default function InstalarPage() {
  return (
    <div className="page-wrap">
      <header className="page-header">
        <p className="eyebrow">Implantação</p>
        <h1 className="display-lg text-gradient">Hospedar MXDRPG</h1>
        <p className="lead">
          Produto = app Next.js na raiz do repositório. Imagem Docker; produção em{" "}
          <strong>www.mxdrpg.com.br</strong> (Contabo).
        </p>
      </header>

      <article className="glass content-card">
        <h2>Docker</h2>
        <pre>{`npm ci
npm run build
docker build -t mxdrpg .
docker run -p 3000:3000 --env-file .env.production mxdrpg`}</pre>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "1rem 0 0" }}>
          Env mínimo: <code>DATABASE_URL</code>, <code>SESSION_SECRET</code>, <code>NODE_ENV=production</code>.
          Clerk opcional — ver <code>DEPLOY.md</code>.
        </p>
      </article>

      <article className="glass content-card">
        <h2>Repositórios</h2>
        <ul style={{ color: "var(--text-muted)", lineHeight: 1.9, margin: 0, paddingLeft: "1.2rem" }}>
          <li>raiz do repo — site + VTT</li>
          <li>
            <code>livros/</code> — regras Markdown
          </li>
        </ul>
      </article>
    </div>
  );
}
