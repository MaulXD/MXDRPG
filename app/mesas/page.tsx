import { redirect } from "next/navigation";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { ELDARIN_MESAS_PATH } from "@/lib/rpg/systems";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata("Mesas");

export default async function MesasHubPage() {
  const session = await getSession();
  if (!session) redirect(signInPath(ELDARIN_MESAS_PATH));
  redirect(ELDARIN_MESAS_PATH);
}
