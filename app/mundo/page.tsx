import Link from "next/link";
import { WorldLoreBrowser } from "@/components/world/WorldLoreBrowser";
import { PantheonLoreSection } from "@/components/world/PantheonLoreSection";
import { TorWorldLore } from "@/components/world/TorWorldLore";
import { RpgSystemContentTabs } from "@/components/rpg/RpgSystemContentTabs";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import { normalizeRpgSystemId } from "@/lib/rpg/systems";
import { pageMetadata } from "@/lib/site-metadata";
import "@/components/world/world-lore.css";

export const metadata = pageMetadata(
  "Mundo",
  "Geografia, vilarejos, cenários e as doze devoções de Eldarin — ou Eriador, na Terra-média do Um Anel."
);

type Props = {
  searchParams: Promise<{ sistema?: string }>;
};

export default async function MundoPage({ searchParams }: Props) {
  const { sistema } = await searchParams;
  const systemId = normalizeRpgSystemId(sistema);

  if (systemId === "um-anel") {
    return (
      <div className="page-wrap page-hero">
        <RpgSystemContentTabs current={systemId} basePath="/mundo" />
        <p className="eyebrow">O Um Anel · Lore</p>
        <h1 className="display-lg">Eriador</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "58ch", marginBottom: "2rem" }}>
          As Terras do Oeste da Terra-média perto do fim da Terceira Era.
        </p>
        <MedievalFrame variant="iron" page>
          <TorWorldLore />
        </MedievalFrame>
      </div>
    );
  }

  return (
    <div className="page-wrap page-hero">
      <RpgSystemContentTabs current={systemId} basePath="/mundo" />
      <p className="eyebrow">
        <Link href="/sistema" style={{ color: "var(--text-muted)" }}>
          ← Eldarin
        </Link>{" "}
        · Lore
      </p>
      <h1 className="display-lg">Mundo de Eldarin</h1>
      <p style={{ color: "var(--text-muted)", maxWidth: "58ch", marginBottom: "2rem" }}>
        Reinos, vilarejos, rotas e as Onze Bocas — com ganchos de campanha. Passe o mouse nos nomes
        para lore completo. O panteão abaixo espelha as opções da ficha de personagem.
      </p>

      <MedievalFrame variant="parchment" page>
        <PantheonLoreSection />
      </MedievalFrame>

      <div style={{ marginTop: "1.5rem" }}>
      <MedievalFrame variant="iron" page>
        <h2 style={{ marginTop: 0, fontSize: "1.25rem" }}>Atlas de lugares</h2>
        <WorldLoreBrowser />
      </MedievalFrame>
      </div>
    </div>
  );
}
