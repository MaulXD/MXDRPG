import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CompendiumPage, isCompendiumPackId } from "@/components/compendium/CompendiumPage";
import { getCompendiumPackLabel } from "@/lib/compendium/registry";
import { pageMetadata } from "@/lib/site-metadata";

type Props = {
  params: Promise<{ packId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { packId } = await params;
  if (!isCompendiumPackId(packId)) return pageMetadata("Compêndios");
  return pageMetadata(getCompendiumPackLabel(packId));
}

export default async function CompendiosPackPage({ params }: Props) {
  const { packId } = await params;
  if (!isCompendiumPackId(packId)) {
    redirect("/compendios");
  }
  return <CompendiumPage initialPackId={packId} />;
}
