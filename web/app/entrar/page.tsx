import { LoginForm } from "@/components/auth/LoginForm";

type Props = { searchParams: Promise<{ redirect?: string }> };

export default async function EntrarPage({ searchParams }: Props) {
  const params = await searchParams;
  const redirect = params.redirect ?? "";

  return (
    <div className="page-wrap" style={{ maxWidth: 480, paddingTop: "2rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.5rem" }}>
        <p className="eyebrow">Acesso</p>
        <h1 className="display-lg">Entrar</h1>
        <p className="lead">Admin · Mestre · Jogador — demo com senha <code>vinite-dev</code></p>
      </header>

      <div className="glass" style={{ padding: "1.75rem" }}>
        <LoginForm redirect={redirect} />
      </div>

      <article className="glass content-card" style={{ marginTop: "1.25rem" }}>
        <h2>Contas demo</h2>
        <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--text-muted)", lineHeight: 1.8 }}>
          <li>
            <code>admin@vinite.local</code>
          </li>
          <li>
            <code>mestre@vinite.local</code>
          </li>
          <li>
            <code>jogador@vinite.local</code>
          </li>
        </ul>
      </article>
    </div>
  );
}
