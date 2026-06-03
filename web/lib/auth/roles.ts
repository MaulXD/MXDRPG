import type { UserRole } from "./types";

export const ROLES: Record<
  UserRole,
  { label: string; description: string; level: number; homePath: string }
> = {
  admin: {
    label: "Administrador",
    description: "Configuração global, usuários e mundos.",
    level: 100,
    homePath: "/admin",
  },
  mestre: {
    label: "Mestre",
    description: "Campanhas, cenas Foundry e mesa.",
    level: 50,
    homePath: "/mestre",
  },
  jogador: {
    label: "Jogador",
    description: "Personagens, fichas e sessões.",
    level: 10,
    homePath: "/jogador",
  },
};

export const ROLE_ORDER: UserRole[] = ["admin", "mestre", "jogador"];

export function roleAtLeast(userRole: UserRole, required: UserRole): boolean {
  return ROLES[userRole].level >= ROLES[required].level;
}

export function portalPathForRole(role: UserRole): string {
  return ROLES[role].homePath;
}
