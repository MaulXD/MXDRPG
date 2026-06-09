import { AdminMesasPanel } from "@/components/admin/AdminMesasPanel";
import { requireRole } from "@/lib/auth/session";

export default async function AdminMesasPage() {
  await requireRole(["admin"]);

  return (
    <>
      <h2 className="neon-title" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
        Mesas e membros
      </h2>
      <AdminMesasPanel />
    </>
  );
}
