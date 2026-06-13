import { CompendiumPage } from "@/components/compendium/CompendiumPage";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata("Compêndios");

export default function CompendiosPage() {
  return <CompendiumPage />;
}
