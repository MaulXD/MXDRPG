import { AuthTabs } from "@/components/auth/AuthTabs";
import { isClerkEnabled } from "@/lib/auth/clerk-config";

type Props = { searchParams: Promise<{ redirect?: string }> };

export default async function EntrarPage({ searchParams }: Props) {
  const params = await searchParams;
  const redirect = params.redirect ?? "";

  return (
    <div className="page-wrap" style={{ maxWidth: 480, paddingTop: "2rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.5rem" }}>
        <p className="eyebrow">Conta Eldarin</p>
        <h1 className="display-lg">Entrar ou criar conta</h1>
        <p className="lead">
          Uma conta para tudo — ao criar conta você pode abrir mesas como mestre e definir o código de
          convite (até 10 caracteres) para os jogadores.
        </p>
      </header>

      <div className="glass" style={{ padding: "1.75rem" }}>
        <AuthTabs redirect={redirect} clerkEnabled={isClerkEnabled()} />
      </div>

      <article className="glass content-card" style={{ marginTop: "1.25rem" }}>
        <h2>Contas demo</h2>
        <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.8 }}>
          Usuário <code>mestre</code> ou <code>jogador</code> · senha <code>123</code>
        </p>
      </article>
    </div>
  );
}
