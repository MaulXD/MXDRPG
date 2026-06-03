import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { portalPathForRole } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/entrar?redirect=/admin");
  if (session.user.role !== "admin") redirect(portalPathForRole(session.user.role));
  return <PortalShell user={session.user}>{children}</PortalShell>;
}
