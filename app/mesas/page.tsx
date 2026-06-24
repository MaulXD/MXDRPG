import Link from "next/link";
import { redirect } from "next/navigation";
import { RpgSystemCoverCard } from "@/components/rpg/RpgSystemCoverCard";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { RPG_SYSTEMS } from "@/lib/rpg/systems";
import { pageMetadata } from "@/lib/site-metadata";
import "@/components/rpg/mesas-hub.css";

export const metadata = pageMetadata("Escolher RPG");

export default async function MesasHubPage() {
  const session = await getSession();
  if (!session) redirect(signInPath("/mesas"));

  return (
    <div className="page-wrap mesas-hub-wrap">
      <header className="page-header mesas-hub-header">
        <p className="eyebrow">MXDRPG · sistemas</p>
        <h1 className="display-lg">Escolha seu RPG</h1>
      </header>

      <MedievalFrame variant="royal" page>
        <div className="rpg-hub-grid">
          {RPG_SYSTEMS.map((sys) => (
            <RpgSystemCoverCard key={sys.id} system={sys} />
          ))}
        </div>

        <div className="rpg-hub-demo-banner">
          <p className="rpg-hub-demo-banner__text">
            Quer testar antes de criar uma mesa?
          </p>
          <Link href="/mesa/demo" prefetch={false} className="btn btn-secondary btn-sm">
            Abrir demo pública do Eldarin
          </Link>
        </div>
      </MedievalFrame>
    </div>
  );
}
