import { normalizeNickname } from "@/lib/auth/nickname";

/** Avatar ilustrado derivado do apelido (DiceBear — hotlink público). */
export function nicknameAvatarUrl(nickname: string, size = 256): string {
  const seed = encodeURIComponent(normalizeNickname(nickname) || "jogador");
  return `https://api.dicebear.com/9.x/adventurer/png?seed=${seed}&size=${size}`;
}
