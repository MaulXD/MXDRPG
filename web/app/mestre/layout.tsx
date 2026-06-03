import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { roleAtLeast, portalPathForRole } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";

export default async function MestreLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/entrar?redirect=/mestre");
  if (!roleAtLeast(session.user.role, "mestre")) redirect(portalPathForRole(session.user.role));
  return <PortalShell user={session.user}>{children}</PortalShell>;
}
