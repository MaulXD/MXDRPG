import { redirect } from "next/navigation";
import { CompendiumPage, isCompendiumPackId } from "@/components/compendium/CompendiumPage";

type Props = {
  params: Promise<{ packId: string }>;
};

export default async function CompendiosPackPage({ params }: Props) {
  const { packId } = await params;
  if (!isCompendiumPackId(packId)) {
    redirect("/compendios");
  }
  return <CompendiumPage initialPackId={packId} />;
}
