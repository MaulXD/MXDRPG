import Link from "next/link";
import { DashboardCard } from "@/components/portal/DashboardCard";
import { PermissionGate } from "@/components/portal/PermissionGate";
import { Permission } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export default async function MestrePage() {
  const user = await requireRole(["admin", "mestre"]);

  return (
    <>
      <h2 className="neon-title" style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Mesa do Mestre
      </h2>
      <Link href="/mesa/demo" className="btn" style={{ marginBottom: "1.25rem" }}>
        Abrir mesa VTT
      </Link>
      <div className="grid-2">
        <PermissionGate role={user.role} permission={Permission.CAMPAIGNS_MANAGE}>
          <DashboardCard
            title="Campanhas"
            description="Criar salas, convidar jogadores e controlar cenas hex."
            accent="cyan"
          />
        </PermissionGate>
        <PermissionGate role={user.role} permission={Permission.SCENES_MANAGE}>
          <DashboardCard
            title="Cenas & combate"
            description="Tokens, iniciativa, Drag Ruler e Terrain Ruler."
            accent="lime"
          />
        </PermissionGate>
        <PermissionGate role={user.role} permission={Permission.COMPENDIUMS_MANAGE}>
          <DashboardCard
            title="Compendiums"
            description="Armas, habilidades, magias e NPCs prontos para a mesa."
            accent="magenta"
            href="/biblioteca"
          />
        </PermissionGate>
        <PermissionGate role={user.role} permission={Permission.PLAYERS_VIEW}>
          <DashboardCard
            title="Jogadores"
            description="Fichas vinculadas, PA, movimento hex e status na mesa."
            accent="cyan"
          />
        </PermissionGate>
      </div>
    </>
  );
}
