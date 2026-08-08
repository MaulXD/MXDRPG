import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CompendiumPage, isCompendiumPackId } from "@/components/compendium/CompendiumPage";
import { RpgSystemContentTabs } from "@/components/rpg/RpgSystemContentTabs";
import { getCompendiumPackLabel } from "@/lib/compendium/registry";
import { normalizeRpgSystemId } from "@/lib/rpg/systems";
import { pageMetadata } from "@/lib/site-metadata";

type Props = {
  params: Promise<{ packId: string }>;
  searchParams: Promise<{ sistema?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { packId } = await params;
  if (!isCompendiumPackId(packId)) return pageMetadata("Compêndios");
  return pageMetadata(getCompendiumPackLabel(packId));
}

export default async function CompendiosPackPage({ params, searchParams }: Props) {
  const { packId } = await params;
  if (!isCompendiumPackId(packId)) {
    redirect("/compendios");
  }

  /* As abas de sistema precisam existir AQUI também.
     Sem elas, entrar num pack (`/compendios/armas`) fazia o seletor Eldarin ↔
     O Um Anel sumir da tela: o usuário ficava preso no conteúdo de um sistema
     sem caminho de volta para o outro. É isolamento de hub quebrado na
     navegação — os dois sistemas existem, mas só um fica alcançável.

     Os packs desta rota são todos de Eldarin; `normalizeRpgSystemId` decide qual
     aba fica marcada quando a URL traz `?sistema=`. */
  const { sistema } = await searchParams;
  const systemId = normalizeRpgSystemId(sistema);

  return (
    <CompendiumPage
      initialPackId={packId}
      topSlot={<RpgSystemContentTabs current={systemId} basePath="/compendios" />}
    />
  );
}
