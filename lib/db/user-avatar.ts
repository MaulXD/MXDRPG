import { validateImageDataUrl } from "@/lib/media/image-data-url";

export type AvatarSource = "oauth" | "custom";

export function normalizeAvatarSource(raw: unknown): AvatarSource {
  return raw === "custom" ? "custom" : "oauth";
}

/** URL exibida conforme preferência do usuário. */
export function resolveUserAvatarUrl(input: {
  avatarSource?: string | null;
  avatarUrl?: string | null;
  oauthAvatarUrl?: string | null;
}): string | null {
  const source = normalizeAvatarSource(input.avatarSource);
  if (source === "custom") {
    const custom = input.avatarUrl?.trim();
    return custom || input.oauthAvatarUrl?.trim() || null;
  }
  return input.oauthAvatarUrl?.trim() || input.avatarUrl?.trim() || null;
}

export function sanitizeCustomAvatarUrl(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:image/")) {
    return validateImageDataUrl(trimmed);
  }
  if (/^https?:\/\//i.test(trimmed) && trimmed.length <= 2048) {
    return trimmed;
  }
  return null;
}
