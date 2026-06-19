import { redirect } from "next/navigation";
import { profileOnboardingPath, safeRedirectPath, DEFAULT_POST_AUTH_PATH } from "@/lib/auth/post-auth-redirect";

type Props = { searchParams: Promise<{ redirect?: string }> };

/** Legado — primeiro acesso agora em /conta/bem-vindo */
export default async function ApelidoLegacyPage({ searchParams }: Props) {
  const params = await searchParams;
  const dest = safeRedirectPath(params.redirect) ?? DEFAULT_POST_AUTH_PATH;
  redirect(profileOnboardingPath(dest));
}
