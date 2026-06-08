import { SignIn } from "@clerk/nextjs";
import { clerkSocialOnlyAppearance } from "@/lib/auth/clerk-appearance";
import {
  DEFAULT_POST_AUTH_PATH,
  safeRedirectPath,
} from "@/lib/auth/post-auth-redirect";

type Props = { searchParams: Promise<{ redirect?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const afterAuth = safeRedirectPath(params.redirect) ?? DEFAULT_POST_AUTH_PATH;
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
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl={signUpUrl}
          forceRedirectUrl={afterAuth}
          appearance={clerkSocialOnlyAppearance}
        />
      </div>
    </div>
  );
}
