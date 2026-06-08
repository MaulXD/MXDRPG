import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect(signInPath("/painel"));

  return <PortalShell user={session.user}>{children}</PortalShell>;
}
