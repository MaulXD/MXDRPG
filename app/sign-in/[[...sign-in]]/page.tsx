import { redirect } from "next/navigation";
import { safeRedirectPath, DEFAULT_POST_AUTH_PATH } from "@/lib/auth/post-auth-redirect";

type Props = { searchParams: Promise<{ redirect?: string }> };

/** Legado — redireciona para /entrar. */
export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const dest = safeRedirectPath(params.redirect) ?? DEFAULT_POST_AUTH_PATH;
  redirect(`/entrar?redirect=${encodeURIComponent(dest)}`);
}
