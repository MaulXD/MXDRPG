import { redirect } from "next/navigation";
import { RpgSystemCoverCard } from "@/components/rpg/RpgSystemCoverCard";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { signInPath } from "@/lib/auth/post-auth-redirect";
import { getSession } from "@/lib/auth/session";
import { MESAS_HUB_PATH, RPG_SYSTEMS } from "@/lib/rpg/systems";
import { pageMetadata } from "@/lib/site-metadata";
import "@/components/rpg/mesas-hub.css";

export const metadata = pageMetadata("Escolher RPG");

export default async function MesasHubPage() {
  const session = await getSession();
  if (!session) redirect(signInPath(MESAS_HUB_PATH));

  // Se só existe um sistema disponível, pula direto pra ele — o seletor só
  // faz sentido quando há de fato uma escolha a fazer.
  const availableSystems = RPG_SYSTEMS.filter((sys) => sys.available && sys.href);
  if (availableSystems.length === 1) redirect(availableSystems[0].href!);

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
      </MedievalFrame>
    </div>
  );
}
