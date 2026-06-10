import { redirect } from "next/navigation";
import { NicknameForm } from "@/components/auth/NicknameForm";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import {
  apelidoPathWithRedirect,
  DEFAULT_POST_AUTH_PATH,
  safeRedirectPath,
  signInPath,
} from "@/lib/auth/post-auth-redirect";
import { dbEnabled } from "@/lib/db/enabled";
import { getSession } from "@/lib/auth/session";

type Props = { searchParams: Promise<{ redirect?: string }> };

export default async function ApelidoPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await getSession();
  const dest = safeRedirectPath(params.redirect) ?? DEFAULT_POST_AUTH_PATH;

  if (!session) redirect(signInPath(apelidoPathWithRedirect(dest)));
  if (session.user.nickname) redirect(dest);
  if (!dbEnabled()) redirect(dest);

  return (
    <div className="page-wrap" style={{ maxWidth: 420, paddingTop: "2rem" }}>
      <header className="page-header" style={{ paddingBottom: "1rem" }}>
        <EldarinLogo variant="full" href="/" />
        <p className="eyebrow" style={{ marginTop: "1rem" }}>
          Conta
        </p>
        <h1 className="display-lg">Escolha seu apelido</h1>
        <p className="lead">Apelido para login rápido na mesa. Em seguida você cria ou entra em partidas.</p>
      </header>
      <div className="glass" style={{ padding: "1.5rem" }}>
        <NicknameForm initialNickname="" redirectAfterSave={dest} />
      </div>
    </div>
  );
}
