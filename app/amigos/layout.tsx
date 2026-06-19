import { signInPath, profileOnboardingPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { dbEnabled } from "@/lib/db/enabled";
import { redirect } from "next/navigation";

export default async function AmigosLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect(signInPath("/amigos"));
  if (dbEnabled() && !session.user.nickname) {
    redirect(profileOnboardingPath("/amigos"));
  }
  return children;
}
