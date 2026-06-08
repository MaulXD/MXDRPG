import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { portalPathForRole } from "@/lib/auth/roles";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect(signInPath("/admin"));
  if (session.user.role !== "admin") redirect(portalPathForRole(session.user.role));
  return <PortalShell user={session.user}>{children}</PortalShell>;
}
