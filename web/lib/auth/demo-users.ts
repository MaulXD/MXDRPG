import type { SessionUser, UserRole } from "./types";

/**
 * Usuários demo — trocar por DB / Clerk / Auth0 em produção.
 * Senha única em dev: variável ELDARIN_DEMO_PASSWORD (default vinite-dev)
 */
export const DEMO_USERS: Array<SessionUser & { password: string }> = [
  {
    id: "usr_admin_01",
    email: "admin@vinite.local",
    name: "Admin Eldarin",
    role: "admin",
    password: process.env.ELDARIN_DEMO_PASSWORD ?? "vinite-dev",
  },
  {
    id: "usr_mestre_01",
    email: "mestre@vinite.local",
    name: "Mestre da Masmorra",
    role: "mestre",
    password: process.env.ELDARIN_DEMO_PASSWORD ?? "vinite-dev",
  },
  {
    id: "usr_jogador_01",
    email: "jogador@vinite.local",
    name: "Aventureiro",
    role: "jogador",
    password: process.env.ELDARIN_DEMO_PASSWORD ?? "vinite-dev",
  },
];

export function authenticateDemo(email: string, password: string): SessionUser | null {
  const found = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!found) return null;
  const { password: _, ...user } = found;
  return user;
}

export function demoUserByRole(role: UserRole): SessionUser | null {
  const found = DEMO_USERS.find((u) => u.role === role);
  if (!found) return null;
  const { password: _, ...user } = found;
  return user;
}
