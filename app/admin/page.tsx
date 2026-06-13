import { DashboardCard } from "@/components/portal/DashboardCard";
import { PermissionGate } from "@/components/portal/PermissionGate";
import { Permission } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata("Painel administrador");

export default async function AdminPage() {
  const user = await requireRole(["admin"]);

  return (
    <>
      <h2 className="neon-title" style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Painel Administrador
      </h2>
      <div className="grid-2">
        <PermissionGate role={user.role} permission={Permission.USERS_MANAGE}>
          <DashboardCard
            title="Usuários"
            description="Gerir contas Admin, Mestres e Jogadores. Convites e banimentos."
            accent="magenta"
          />
        </PermissionGate>
        <PermissionGate role={user.role} permission={Permission.WORLDS_MANAGE}>
          <DashboardCard
            title="Mundos Foundry"
            description="Vincular instâncias, manifests do sistema Eldarin e backups."
            accent="cyan"
          />
        </PermissionGate>
        <PermissionGate role={user.role} permission={Permission.SYSTEM_CONFIG}>
          <DashboardCard
            title="Sistema"
            description="Versão do pacote Foundry, módulos obrigatórios e feature flags."
            accent="lime"
          />
        </PermissionGate>
        <DashboardCard
          title="Mesas"
          description="Ver aventuras, corrigir mestre e atribuir jogadores quando aparecem como visitante."
          accent="lime"
          href="/admin/mesas"
        />
        <DashboardCard
          title="Auditoria"
          description="Logs de login, alterações de campanha e exportações."
          accent="cyan"
        />
      </div>
    </>
  );
}
