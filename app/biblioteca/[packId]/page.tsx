import { redirect } from "next/navigation";
import { isCompendiumPackId } from "@/components/compendium/CompendiumPage";

type Props = {
  params: Promise<{ packId: string }>;
};

/** Legado — /biblioteca/armas → /compendios/armas */
export default async function BibliotecaPackPage({ params }: Props) {
  const { packId } = await params;
  if (isCompendiumPackId(packId)) {
    redirect(`/compendios/${packId}`);
  }
  redirect("/compendios");
}
