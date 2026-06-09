import { redirect } from "next/navigation";
import { ClerkSignInPanel } from "@/components/auth/ClerkSignInPanel";
import { hasClerkPublishableKey } from "@/lib/auth/clerk-config";
import {
  DEFAULT_POST_AUTH_PATH,
  postAuthRedirect,
  safeRedirectPath,
} from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";

type Props = { searchParams: Promise<{ redirect?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  if (!hasClerkPublishableKey()) {
    return (
      <div className="page-wrap" style={{ maxWidth: 480, paddingTop: "2rem" }}>
        <h1 className="display-lg">Entrar</h1>
        <p className="lead">
          Login social não está configurado neste ambiente. Defina{" "}
          <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> e <code>CLERK_SECRET_KEY</code> na Vercel.
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
  const signUpUrl = `/sign-up?redirect=${encodeURIComponent(afterAuth)}`;

  return (
    <div className="page-wrap" style={{ maxWidth: 480, paddingTop: "2rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.25rem" }}>
        <p className="eyebrow">Conta Eldarin</p>
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
