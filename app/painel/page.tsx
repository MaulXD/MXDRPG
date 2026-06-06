import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { dbEnabled } from "@/lib/db/enabled";

/** Conta unificada — fluxo principal passa por /rpg → /eldarin. */
export default async function PainelPage() {
  const user = await requireSession();
  if (dbEnabled() && !user.nickname) {
    redirect("/entrar/apelido?redirect=/rpg");
  }
  redirect("/eldarin");
}
