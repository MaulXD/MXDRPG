import type { Permission } from "@/lib/auth/permissions";
import { can } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/types";

type Props = {
  role: UserRole;
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function PermissionGate({ role, permission, children, fallback = null }: Props) {
  if (!can(role, permission)) return <>{fallback}</>;
  return <>{children}</>;
}
