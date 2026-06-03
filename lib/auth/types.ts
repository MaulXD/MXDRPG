/** Papéis da plataforma — sem “mestre/jogador” global */
export type UserRole = "member" | "admin";

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
