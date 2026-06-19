import { redirect } from "next/navigation";
import { ProfileOnboardingForm } from "@/components/auth/ProfileOnboardingForm";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import {
  DEFAULT_POST_AUTH_PATH,
  profileOnboardingPath,
  safeRedirectPath,
  signInPath,
} from "@/lib/auth/post-auth-redirect";
import { materializeSessionUser } from "@/lib/auth/session-user";
import { dbSqlReady } from "@/lib/db/sql-ready";
import { getSession } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata("Configure seu perfil");

type Props = { searchParams: Promise<{ redirect?: string }> };

export default async function ContaBemVindoPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await getSession();
  const dest = safeRedirectPath(params.redirect) ?? DEFAULT_POST_AUTH_PATH;

  if (!session) redirect(signInPath(profileOnboardingPath(dest)));
  if (!dbSqlReady()) redirect(dest);
  if (session.user.nickname?.trim()) redirect(dest);

  const accountUser = await materializeSessionUser(session.user);

  return (
    <div className="page-wrap" style={{ maxWidth: 520, paddingTop: "2rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.25rem" }}>
        <EldarinLogo variant="full" href="/" />
        <p className="eyebrow" style={{ marginTop: "1rem" }}>
          Primeiro acesso
        </p>
        <h1 className="display-lg">Configure seu perfil</h1>
        <p className="lead">
          Escolha um <strong>apelido</strong> (obrigatório) e como quer aparecer na mesa. Depois você
          pode alterar tudo em <strong>Conta</strong>.
        </p>
      </header>
      <div className="glass" style={{ padding: "1.5rem" }}>
        <ProfileOnboardingForm initialUser={accountUser} redirectAfter={dest} />
      </div>
    </div>
  );
}
