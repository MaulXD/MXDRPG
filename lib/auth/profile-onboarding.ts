import { dbNicknameFlowEnabled } from "@/lib/db/enabled";
import type { SessionUser } from "@/lib/auth/types";
import { safeRedirectPath, DEFAULT_POST_AUTH_PATH } from "@/lib/auth/post-auth-redirect";

export const PROFILE_ONBOARDING_PATH = "/conta/bem-vindo";

export function needsProfileOnboarding(user: SessionUser): boolean {
  return dbNicknameFlowEnabled() && !user.nickname?.trim();
}

export function profileOnboardingPath(dest?: string | null): string {
  const safe = safeRedirectPath(dest) ?? DEFAULT_POST_AUTH_PATH;
  if (safe === DEFAULT_POST_AUTH_PATH) return PROFILE_ONBOARDING_PATH;
  return `${PROFILE_ONBOARDING_PATH}?redirect=${encodeURIComponent(safe)}`;
}

/** @deprecated Use profileOnboardingPath — legado /entrar/apelido */
export function apelidoPathWithRedirect(dest: string): string {
  return profileOnboardingPath(dest);
}
