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

export function roleAtLeast(userRole: UserRole, required: UserRole): boolean {
  return ROLES[userRole].level >= ROLES[required].level;
}

export function portalPathForRole(role: UserRole): string {
  return ROLES[role].homePath;
}
