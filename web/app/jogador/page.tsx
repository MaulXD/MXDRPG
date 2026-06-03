import Link from "next/link";
import { DashboardCard } from "@/components/portal/DashboardCard";
import { PermissionGate } from "@/components/portal/PermissionGate";
import { Permission } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export default async function JogadorPage() {
  const user = await requireRole(["admin", "mestre", "jogador"]);

  return (
    <>
      <h2 className="neon-title" style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Área do Jogador
      </h2>
      <Link href="/mesa/demo" className="btn" style={{ marginBottom: "1.25rem" }}>
        Entrar na mesa
      </Link>
      <div className="grid-2">
        <PermissionGate role={user.role} permission={Permission.CHARACTERS_OWN}>
          <DashboardCard
            title="Personagens"
            description="Fichas Eldarin: atributos, PA, movimento hex e inventário."
            accent="magenta"
            href="/personagem/pc-aventureiro"
          />
        </PermissionGate>
        <PermissionGate role={user.role} permission={Permission.SESSIONS_JOIN}>
          <DashboardCard
            title="Sessões"
            description="Campanhas ativas e link para o mundo Foundry."
            accent="cyan"
          />
        </PermissionGate>
        <PermissionGate role={user.role} permission={Permission.SHEETS_VIEW}>
          <DashboardCard
            title="Compêndios"
            description="Armas, habilidades, magias — browse e adicione na ficha."
            accent="lime"
            href="/biblioteca"
          />
        </PermissionGate>
      </div>
    </>
  );
}
