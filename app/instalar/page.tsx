import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata("Hospedar na Vercel");

export default function InstalarPage() {
  return (
    <div className="page-wrap">
      <header className="page-header">
        <p className="eyebrow">Implantação</p>
        <h1 className="display-lg text-gradient">Hospedar na Vercel</h1>
        <p className="lead">Produto = app Next.js na raiz do repositório. VTT Eldarin próprio, sem apps de terceiros.</p>
      </header>

      <article className="glass content-card">
        <h2>Vercel</h2>
        <pre>{`npm install
npm run build
# Diretório raiz do projeto na Vercel`}</pre>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "1rem 0 0" }}>
          Env: <code>ELDARIN_DEMO_PASSWORD</code> para senha do login demo.
        </p>
      </article>

      <article className="glass content-card">
        <h2>Repositórios</h2>
        <ul style={{ color: "var(--text-muted)", lineHeight: 1.9, margin: 0, paddingLeft: "1.2rem" }}>
          <li>
            raiz do repo — site + VTT
          </li>
          <li>
            <code>livros/</code> — regras Markdown
          </li>
        </ul>
      </article>
    </div>
  );
}
