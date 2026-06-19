import { redirect } from "next/navigation";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { ELDARIN_MESAS_PATH } from "@/lib/rpg/systems";

export const dynamic = "force-dynamic";

export default async function EldarinMesasLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect(signInPath(ELDARIN_MESAS_PATH));
  return children;
}
