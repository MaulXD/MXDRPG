import { redirect } from "next/navigation";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { dbEnabled } from "@/lib/db/enabled";

/** Conta unificada — fluxo principal passa por /rpg → /eldarin. */
export default async function PainelPage() {
  const session = await getSession();
  if (!session) redirect(signInPath("/eldarin"));
  const user = session.user;
  if (dbEnabled() && !user.nickname) {
    redirect("/entrar/apelido?redirect=/rpg");
  }
  redirect("/eldarin");
}
