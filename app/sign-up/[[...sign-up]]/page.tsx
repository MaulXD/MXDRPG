import { redirect } from "next/navigation";
import { ClerkSignUpPanel } from "@/components/auth/ClerkSignUpPanel";
import { hasClerkPublishableKey } from "@/lib/auth/clerk-config";
import {
  DEFAULT_POST_AUTH_PATH,
  postAuthRedirect,
  safeRedirectPath,
} from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata("Criar conta");

type Props = { searchParams: Promise<{ redirect?: string }> };

export default async function SignUpPage({ searchParams }: Props) {
  if (!hasClerkPublishableKey()) {
    return (
      <div className="page-wrap" style={{ maxWidth: 480, paddingTop: "2rem" }}>
        <h1 className="display-lg">Criar conta</h1>
        <p className="lead">
          Cadastro social não está configurado neste ambiente. Defina as variáveis Clerk na Vercel.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const afterAuth = safeRedirectPath(params.redirect) ?? DEFAULT_POST_AUTH_PATH;
  const session = await getSession();
  if (session) {
    redirect(postAuthRedirect(session.user, afterAuth));
  }
  const signInUrl = `/sign-in?redirect=${encodeURIComponent(afterAuth)}`;

  return (
    <div className="page-wrap" style={{ maxWidth: 480, paddingTop: "2rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.25rem" }}>
        <p className="eyebrow">Conta Eldarin</p>
        <h1 className="display-lg">Criar conta</h1>
        <p className="lead" style={{ marginBottom: 0 }}>
          Entre com Google ou Discord. Conta nova pode abrir mesas como mestre.
        </p>
      </header>
      <div
        className="glass auth-card clerk-social-only"
        style={{ padding: "1.25rem 1.5rem 2rem", display: "flex", justifyContent: "center" }}
      >
        <ClerkSignUpPanel signInUrl={signInUrl} forceRedirectUrl={afterAuth} />
      </div>
    </div>
  );
}
