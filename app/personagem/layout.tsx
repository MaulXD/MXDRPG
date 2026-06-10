import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function PersonagemLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    const h = await headers();
    const path = h.get("x-pathname") ?? h.get("x-invoke-path") ?? "/personagem";
    const redirectTo = path.startsWith("/personagem") ? path : "/personagem";
    redirect(signInPath(redirectTo));
  }
  return <PortalShell user={session.user}>{children}</PortalShell>;
}
