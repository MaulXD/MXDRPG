import { redirect } from "next/navigation";
import { NicknameForm } from "@/components/auth/NicknameForm";
import { DEFAULT_POST_AUTH_PATH, safeRedirectPath } from "@/lib/auth/post-auth-redirect";
import { dbEnabled } from "@/lib/db/enabled";
import { getSession } from "@/lib/auth/session";

type Props = { searchParams: Promise<{ redirect?: string }> };

export default async function ApelidoPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await getSession();
  const dest = safeRedirectPath(params.redirect) ?? DEFAULT_POST_AUTH_PATH;

  if (!session) redirect(`/entrar?redirect=${encodeURIComponent("/entrar/apelido")}`);
  if (session.user.nickname) redirect(dest);
  if (!dbEnabled()) redirect(dest);

  return (
    <div className="page-wrap" style={{ maxWidth: 420, paddingTop: "2rem" }}>
      <header className="page-header" style={{ paddingBottom: "1rem" }}>
        <p className="eyebrow">Conta</p>
        <h1 className="display-lg">Escolha seu apelido</h1>
        <p className="lead">Usado para login alternativo (além do e-mail). Em seguida você cria ou entra em mesas.</p>
      </header>
      <div className="glass" style={{ padding: "1.5rem" }}>
        <NicknameForm redirect={dest} />
      </div>
    </div>
  );
}
