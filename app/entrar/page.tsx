import { redirect } from "next/navigation";
import { signInPath, safeRedirectPath, DEFAULT_POST_AUTH_PATH } from "@/lib/auth/post-auth-redirect";

type Props = { searchParams: Promise<{ redirect?: string }> };

/** Login local removido — redireciona para Clerk (/sign-in). */
export default async function EntrarPage({ searchParams }: Props) {
  const params = await searchParams;
  const dest = safeRedirectPath(params.redirect) ?? DEFAULT_POST_AUTH_PATH;
  redirect(signInPath(dest));
}
