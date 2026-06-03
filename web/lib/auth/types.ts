/** Papéis da plataforma Eldarin */
export type UserRole = "admin" | "mestre" | "jogador";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface SessionPayload {
  user: SessionUser;
  issuedAt: number;
}
