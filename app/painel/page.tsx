import { redirect } from "next/navigation";
import { signInPath, profileOnboardingPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { dbEnabled } from "@/lib/db/enabled";

/** Legado — redireciona para o hub MXDRPG. */
export default async function PainelPage() {
  const session = await getSession();
  if (!session) redirect(signInPath("/mesas"));
  const user = session.user;
  if (dbEnabled() && !user.nickname) {
    redirect(profileOnboardingPath("/mesas"));
  }
  redirect("/mesas");
}
