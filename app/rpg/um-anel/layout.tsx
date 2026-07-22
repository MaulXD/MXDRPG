import { redirect } from "next/navigation";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { UM_ANEL_MESAS_PATH } from "@/lib/rpg/systems";

export const dynamic = "force-dynamic";

export default async function UmAnelMesasLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect(signInPath(UM_ANEL_MESAS_PATH));
  return children;
}
