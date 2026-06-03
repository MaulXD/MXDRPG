import type { UserRole } from "./types";
import { roleAtLeast } from "./roles";

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
  member: [
    Permission.CAMPAIGNS_MANAGE,
    Permission.CHARACTERS_OWN,
    Permission.SESSIONS_JOIN,
    Permission.SHEETS_VIEW,
    Permission.SCENES_MANAGE,
  ],
};

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAccessArea(role: UserRole, area: "admin" | "painel"): boolean {
  if (area === "painel") return role === "member" || role === "admin";
  return roleAtLeast(role, "admin");
}
