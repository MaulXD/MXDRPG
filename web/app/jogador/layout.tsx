import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { getSession } from "@/lib/auth/session";

export default async function JogadorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/entrar?redirect=/jogador");
  return <PortalShell user={session.user}>{children}</PortalShell>;
}
