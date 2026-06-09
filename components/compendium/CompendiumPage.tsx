import { CompendiumBrowser } from "@/components/compendium/CompendiumBrowser";
import { getSession } from "@/lib/auth/session";
import { getPackEntries, getVisiblePacks } from "@/lib/compendium/registry";
import type { CompendiumPackId } from "@/lib/compendium/types";

const PACK_IDS: CompendiumPackId[] = [
  "armas",
  "habilidades",
  "magias",
  "equipamentos",
  "monstros",
];

export function isCompendiumPackId(value: string): value is CompendiumPackId {
  return (PACK_IDS as string[]).includes(value);
}

type Props = {
  initialPackId?: CompendiumPackId;
};

export async function CompendiumPage({ initialPackId }: Props) {
  const session = await getSession();
  const role = session?.user.role ?? null;
  const packs = getVisiblePacks(role);

  const data = Object.fromEntries(
    packs.map((p) => [p.id, getPackEntries(p.id, { role })])
  ) as Record<CompendiumPackId, ReturnType<typeof getPackEntries>>;

  const resolvedPack =
    initialPackId && packs.some((p) => p.id === initialPackId) ? initialPackId : undefined;

  return (
    <div className="page-wrap page-hero">
      <p className="eyebrow">Biblioteca Eldarin</p>
      <h1 className="display-lg">Compêndios</h1>
      <p style={{ color: "var(--text-muted)", maxWidth: "52ch", marginBottom: "2rem" }}>
        Armas, habilidades, magias e equipamentos para jogadores. Monstros só para o mestre — tudo no
        navegador, integrado à mesa Eldarin.
      </p>
      <CompendiumBrowser packs={packs} data={data} role={role} initialPackId={resolvedPack} />
    </div>
  );
}
