import Link from "next/link";
import { RecoverPasswordForm } from "@/components/auth/RecoverPasswordForm";
import { EldarinLogo } from "@/components/brand/EldarinLogo";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata("Recuperar senha");

export default function RecuperarSenhaPage() {
  return (
    <div className="page-wrap" style={{ maxWidth: 480, paddingTop: "2rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.25rem" }}>
        <EldarinLogo variant="full" href="/" className="eldarin-logo--hero" />
        <h1 className="display-lg" style={{ marginTop: "1rem" }}>
          Recuperar senha
        </h1>
        <p className="lead" style={{ marginBottom: 0 }}>
          Redefina com e-mail + dados cadastrados em{" "}
          <Link href="/conta">seu perfil</Link>.
        </p>
      </header>
      <div className="glass auth-card" style={{ padding: "1.25rem 1.5rem 2rem" }}>
        <RecoverPasswordForm />
      </div>
    </div>
  );
}
