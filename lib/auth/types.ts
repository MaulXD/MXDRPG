import type { PortraitFocus } from "@/lib/media/portrait-focus";

/** Papéis da plataforma — sem “mestre/jogador” global */
export type UserRole = "member" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  nickname?: string | null;
  role: UserRole;
  /** URL resolvida (OAuth ou personalizada). */
  avatarUrl?: string | null;
  /** Foto do provedor OAuth — usada quando avatarSource é oauth. */
  oauthAvatarUrl?: string | null;
  /** Preferência de avatar — só relevante na edição de perfil. */
  avatarSource?: "oauth" | "custom";
  /** Enquadramento da foto personalizada (crop/zoom). */
  avatarFocus?: PortraitFocus | null;
  /** Clerk user id — reconcilia `clerk-{id}` legado em memberIds. */
  clerkId?: string | null;
}

export interface SessionPayload {
  user: SessionUser;
  issuedAt: number;
}
