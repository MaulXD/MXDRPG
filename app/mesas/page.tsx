import Link from "next/link";
import { redirect } from "next/navigation";
import { RpgSystemCoverCard } from "@/components/rpg/RpgSystemCoverCard";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { RPG_SYSTEMS } from "@/lib/rpg/systems";
import "@/components/rpg/mesas-hub.css";

export default async function MesasHubPage() {
  const session = await getSession();
  if (!session) redirect(signInPath("/mesas"));

  return (
    <div className="page-wrap" style={{ maxWidth: 920, paddingTop: "2rem", paddingBottom: "3rem" }}>
      <header className="page-header" style={{ paddingBottom: "1.5rem" }}>
        <p className="eyebrow">MXDRPG · sistemas</p>
        <h1 className="display-lg">Escolha seu RPG</h1>
      </header>

      <MedievalFrame variant="royal" page>
        <div className="rpg-hub-grid">
          {RPG_SYSTEMS.map((sys) => (
            <RpgSystemCoverCard key={sys.id} system={sys} />
          ))}
        </div>

        <p style={{ marginTop: "1.35rem", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 0 }}>
          <Link href="/mesa/demo" prefetch={false}>
            Experimentar demo pública do Eldarin
          </Link>{" "}
          sem criar mesa.
        </p>
      </MedievalFrame>
    </div>
  );
}
