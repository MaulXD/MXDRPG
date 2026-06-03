import type { UserRole } from "./types";
import { roleAtLeast } from "./roles";

/** Permissões granulares da plataforma */
export const Permission = {
  USERS_MANAGE: "users.manage",
  WORLDS_MANAGE: "worlds.manage",
  SYSTEM_CONFIG: "system.config",
  CAMPAIGNS_MANAGE: "campaigns.manage",
  SCENES_MANAGE: "scenes.manage",
  COMPENDIUMS_MANAGE: "compendiums.manage",
  PLAYERS_VIEW: "players.view",
  CHARACTERS_OWN: "characters.own",
  SESSIONS_JOIN: "sessions.join",
  SHEETS_VIEW: "sheets.view",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: Object.values(Permission),
  mestre: [
    Permission.CAMPAIGNS_MANAGE,
    Permission.SCENES_MANAGE,
    Permission.COMPENDIUMS_MANAGE,
    Permission.PLAYERS_VIEW,
    Permission.CHARACTERS_OWN,
    Permission.SESSIONS_JOIN,
    Permission.SHEETS_VIEW,
  ],
  jogador: [
    Permission.CHARACTERS_OWN,
    Permission.SESSIONS_JOIN,
    Permission.SHEETS_VIEW,
  ],
};

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAccessArea(role: UserRole, area: "admin" | "mestre" | "jogador"): boolean {
  return roleAtLeast(role, area);
}
