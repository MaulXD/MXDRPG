import type { UserRole } from "./types";

export const ROLES: Record<
  UserRole,
  { label: string; description: string; level: number; homePath: string }
> = {
  admin: {
    label: "Administrador",
    description: "Configuração global da plataforma.",
    level: 100,
    homePath: "/admin",
  },
  member: {
    label: "Membro",
    description: "Cria mesas, joga nas suas e nas que entrou.",
    level: 10,
    homePath: "/painel",
  },
};

export const ROLE_ORDER: UserRole[] = ["admin", "member"];

/** Papéis globais antigos (cookie/sessão) → modelo atual */
export function normalizeUserRole(role: string | undefined | null): UserRole {
  if (role === "admin" || role === "member") return role;
  if (role === "mestre" || role === "jogador") return "member";
  return "member";
}

export function roleMeta(role: UserRole | string) {
  return ROLES[normalizeUserRole(role)];
}

export function roleAtLeast(userRole: UserRole, required: UserRole): boolean {
  const u = normalizeUserRole(userRole);
  const r = normalizeUserRole(required);
  return ROLES[u].level >= ROLES[r].level;
}

export function portalPathForRole(role: UserRole | string): string {
  return roleMeta(role).homePath;
}
