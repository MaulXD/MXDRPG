import { redirect } from "next/navigation";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function EldarinLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect(signInPath("/eldarin"));
  return children;
}
