import { redirect } from "next/navigation";
import { NicknameForm } from "@/components/auth/NicknameForm";
import { dbEnabled } from "@/lib/db/enabled";
import { getSession } from "@/lib/auth/session";

export default async function ApelidoPage() {
  const session = await getSession();
  if (!session) redirect("/entrar?redirect=/entrar/apelido");
  if (session.user.nickname) redirect("/rpg");
  if (!dbEnabled()) redirect("/rpg");

  return (
    <div className="page-wrap" style={{ maxWidth: 420, paddingTop: "2rem" }}>
      <header className="page-header" style={{ paddingBottom: "1rem" }}>
        <p className="eyebrow">Conta</p>
        <h1 className="display-lg">Escolha seu apelido</h1>
        <p className="lead">Usado para login alternativo (além do e-mail ou Google).</p>
      </header>
      <div className="glass" style={{ padding: "1.5rem" }}>
        <NicknameForm />
      </div>
    </div>
  );
}
