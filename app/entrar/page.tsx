import { redirect } from "next/navigation";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import { authLoginLead, getAuthCapabilities } from "@/lib/auth/auth-capabilities";
import {
  DEFAULT_POST_AUTH_PATH,
  postAuthRedirect,
  safeRedirectPath,
} from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata("Entrar");

type Props = {
  searchParams: Promise<{ redirect?: string; tab?: string; error?: string; msg?: string }>;
};

const ERROR_LABELS: Record<string, string> = {
  oauth_denied: "Login cancelado ou negado pelo provedor.",
  oauth_state: "Sessão OAuth expirada — tente de novo.",
  oauth_invalid: "Resposta OAuth inválida.",
  oauth_unconfigured: "Login social não configurado neste servidor.",
  oauth_failed: "Falha ao concluir login social.",
  oauth_start: "Não foi possível iniciar login social.",
};

export default async function EntrarPage({ searchParams }: Props) {
  const params = await searchParams;
  const afterAuth = safeRedirectPath(params.redirect) ?? DEFAULT_POST_AUTH_PATH;
  const session = await getSession();
  if (session) {
    redirect(postAuthRedirect(session.user, afterAuth));
  }

  const auth = getAuthCapabilities();
  const initialTab = params.tab === "register" ? "register" : "login";
  const errorCode = params.error?.trim();
  const errorMsg =
    (errorCode && ERROR_LABELS[errorCode]) ||
    params.msg?.trim() ||
    (errorCode ? "Erro no login social." : null);

  return (
    <div className="page-wrap" style={{ maxWidth: 480, paddingTop: "2rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.25rem" }}>
        <EldarinLogo variant="full" href="/" className="eldarin-logo--hero" />
        <p className="eyebrow" style={{ marginTop: "1rem" }}>
          Conta Eldarin
        </p>
        <h1 className="display-lg">Entrar ou criar conta</h1>
        <p className="lead" style={{ marginBottom: 0 }}>
          {authLoginLead(auth)}
        </p>
      </header>

      <div className="glass auth-card" style={{ padding: "1.25rem 1.5rem 2rem" }}>
        {errorMsg ? (
          <p className="auth-form__error" role="alert" style={{ marginTop: 0 }}>
            {errorMsg}
          </p>
        ) : null}
        {!auth.persistentAccounts && auth.emailLogin ? (
          <p
            className="auth-form__intro"
            style={{ marginTop: 0, marginBottom: "1rem", color: "var(--text-muted)" }}
          >
            Servidor sem banco — use <strong>Demo Mestre</strong> ou <strong>Demo Jogador</strong>{" "}
            (senha <code>123</code>). Cadastro com e-mail funciona só enquanto o container estiver no ar.
          </p>
        ) : null}
        <AuthTabs
          redirect={afterAuth}
          initialTab={initialTab}
          oauthProviders={auth.oauthProviders}
          persistentAccounts={auth.persistentAccounts}
        />
      </div>

      {auth.emailLogin ? (
        <article className="glass content-card" style={{ marginTop: "1.25rem" }}>
          <h2>Contas demo</h2>
          <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.8 }}>
            Usuário <code>mestre</code> ou <code>jogador</code> · senha <code>123</code>
          </p>
        </article>
      ) : null}
    </div>
  );
}
