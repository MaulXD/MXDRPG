import { CompendiumPage } from "@/components/compendium/CompendiumPage";
import { TorCompendiumPage } from "@/components/compendium/TorCompendiumPage";
import { RpgSystemContentTabs } from "@/components/rpg/RpgSystemContentTabs";
import { normalizeRpgSystemId } from "@/lib/rpg/systems";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata("Compêndios");

type Props = {
  searchParams: Promise<{ sistema?: string }>;
};

export default async function CompendiosPage({ searchParams }: Props) {
  const { sistema } = await searchParams;
  const systemId = normalizeRpgSystemId(sistema);

  if (systemId === "um-anel") {
    return (
      <div className="page-wrap page-hero">
        <RpgSystemContentTabs current={systemId} basePath="/compendios" />
        <p className="eyebrow">Biblioteca · O Um Anel</p>
        <h1 className="display-lg">Compêndios</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "52ch", marginBottom: "2rem" }}>
          Culturas, Vocações, Perícias, Proficiências de Combate e Equipamento de Guerra — regras da
          2ª edição usadas na criação de personagem e na mesa.
        </p>
        <TorCompendiumPage />
      </div>
    );
  }

  return <CompendiumPage topSlot={<RpgSystemContentTabs current={systemId} basePath="/compendios" />} />;
}
