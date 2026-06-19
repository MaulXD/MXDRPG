import { validateImageDataUrl } from "@/lib/media/image-data-url";
import { sanitizePortraitFocus, type PortraitFocus } from "@/lib/media/portrait-focus";
import { nicknameAvatarUrl } from "@/lib/avatar/nickname-avatar";

export type AvatarSource = "oauth" | "custom" | "generated";

export function parseAvatarFocus(value: unknown): PortraitFocus | null {
  return sanitizePortraitFocus(value);
}

export function normalizeAvatarSource(raw: unknown): AvatarSource {
  if (raw === "custom") return "custom";
  if (raw === "generated") return "generated";
  return "oauth";
}

/** URL exibida conforme preferência do usuário. */
export function resolveUserAvatarUrl(input: {
  avatarSource?: string | null;
  avatarUrl?: string | null;
  oauthAvatarUrl?: string | null;
  nickname?: string | null;
}): string | null {
  const source = normalizeAvatarSource(input.avatarSource);
  if (source === "custom") {
    const custom = input.avatarUrl?.trim();
    return custom || input.oauthAvatarUrl?.trim() || null;
  }
  if (source === "generated") {
    const nick = input.nickname?.trim();
    if (nick) return nicknameAvatarUrl(nick);
    return input.oauthAvatarUrl?.trim() || input.avatarUrl?.trim() || null;
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
