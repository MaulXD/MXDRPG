import { CompendiumBrowser } from "@/components/compendium/CompendiumBrowser";
import { getSession } from "@/lib/auth/session";
import { getPackEntries, getVisiblePacks } from "@/lib/compendium/registry";
import type { CompendiumPackId } from "@/lib/compendium/types";

export default async function BibliotecaPage() {
  const session = await getSession();
  const role = session?.user.role ?? null;
  const packs = getVisiblePacks(role);

  const data = Object.fromEntries(
    packs.map((p) => [p.id, getPackEntries(p.id, { role })])
  ) as Record<CompendiumPackId, ReturnType<typeof getPackEntries>>;

  return (
    <div className="page-wrap page-hero">
      <p className="eyebrow">Biblioteca Eldarin</p>
      <h1 className="display-lg">Compêndios</h1>
      <p style={{ color: "var(--text-muted)", maxWidth: "52ch", marginBottom: "2rem" }}>
        Armas, habilidades, magias e equipamentos para jogadores. Monstros só para mestre — como no
        Foundry, mas no browser.
      </p>
      <CompendiumBrowser packs={packs} data={data} role={role} />
    </div>
  );
}
