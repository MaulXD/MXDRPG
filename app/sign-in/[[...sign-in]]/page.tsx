import { redirect } from "next/navigation";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { ClerkSignInPanel } from "@/components/auth/ClerkSignInPanel";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import { hasClerkPublishableKey } from "@/lib/auth/clerk-config";
import {
  DEFAULT_POST_AUTH_PATH,
  postAuthRedirect,
  safeRedirectPath,
} from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata("Entrar");

type Props = { searchParams: Promise<{ redirect?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const afterAuth = safeRedirectPath(params.redirect) ?? DEFAULT_POST_AUTH_PATH;

  if (!hasClerkPublishableKey()) {
    return (
      <div className="page-wrap" style={{ maxWidth: 480, paddingTop: "2rem" }}>
        <header className="page-header" style={{ paddingBottom: "1.25rem" }}>
          <EldarinLogo variant="full" href="/" className="eldarin-logo--hero" />
          <p className="eyebrow" style={{ marginTop: "1rem" }}>
            Conta Eldarin
          </p>
          <h1 className="display-lg">Entrar</h1>
          <p className="lead" style={{ marginBottom: 0 }}>
            Ambiente local — use as contas demo ou e-mail cadastrado.
          </p>
        </header>
        <div className="glass auth-card" style={{ padding: "1.25rem 1.5rem 2rem" }}>
          <AuthTabs redirect={afterAuth} />
        </div>
      </div>
    );
  }

  const session = await getSession();
  if (session) {
    redirect(postAuthRedirect(session.user, afterAuth));
  }
  const signUpUrl = `/sign-up?redirect=${encodeURIComponent(afterAuth)}`;

  return (
    <div className="page-wrap" style={{ maxWidth: 480, paddingTop: "2rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.25rem" }}>
        <EldarinLogo variant="full" href="/" className="eldarin-logo--hero" />
        <p className="eyebrow" style={{ marginTop: "1rem" }}>
          Conta Eldarin
        </p>
        <h1 className="display-lg">Entrar</h1>
        <p className="lead" style={{ marginBottom: 0 }}>
          Use Google ou Discord — uma conta para mesas, fichas e convites.
        </p>
      </header>
      <div
        className="glass auth-card clerk-social-only"
        style={{ padding: "1.25rem 1.5rem 2rem", display: "flex", justifyContent: "center" }}
      >
        <ClerkSignInPanel signUpUrl={signUpUrl} forceRedirectUrl={afterAuth} />
      </div>
    </div>
  );
}
