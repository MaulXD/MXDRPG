import { redirect } from "next/navigation";
import { safeRedirectPath, DEFAULT_POST_AUTH_PATH } from "@/lib/auth/post-auth-redirect";

type Props = { searchParams: Promise<{ redirect?: string }> };

/** Legado — cadastro via /entrar (aba Criar conta). */
export default async function SignUpPage({ searchParams }: Props) {
  const params = await searchParams;
  const dest = safeRedirectPath(params.redirect) ?? DEFAULT_POST_AUTH_PATH;
  redirect(`/entrar?tab=register&redirect=${encodeURIComponent(dest)}`);
}
