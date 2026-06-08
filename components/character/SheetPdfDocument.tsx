"use client";

import { useMemo } from "react";
import type { CharacterSheet, InventoryItem, LootEconomy } from "@/lib/character/types";
import type { CompendiumEntry, CompendiumPackId } from "@/lib/compendium/types";
import { getEntry } from "@/lib/compendium/registry";
import { entrySummary, stripHtml, entryDescriptionHtml } from "@/lib/compendium/format";
import {
  ATTRIBUTE_LABELS,
  attributeMod,
  proficiencyBonus,
  type AttributeKey,
} from "@/lib/character/rules";
import { formatXpProgress } from "@/lib/character/xp";
import { resolveActorDefesa } from "@/lib/character/armor-defense";
import { religionDisplayName } from "@/lib/character/pantheon";
import { firstPortraitDataUrl } from "@/lib/room/portrait-sync";
import { LOOT_NAMES } from "@/lib/character/loot-catalog";
import { EMPTY_LOOT, loadLoot } from "@/lib/character/loot-storage";
import "./sheet-pdf.css";

type Props = {
  character: CharacterSheet;
  inventory: InventoryItem[];
};

function resolveInventory(inventory: InventoryItem[]) {
  return inventory
    .map((ref) => {
      const entry = getEntry(ref.packId, ref.entryId);
      if (!entry) return null;
      return { ref, entry };
    })
    .filter(Boolean) as Array<{ ref: InventoryItem; entry: CompendiumEntry }>;
}

function lootLines(loot: LootEconomy): string[] {
  const lines: string[] = [];
  if (loot.po > 0) lines.push(`${loot.po} PO`);
  for (const kind of ["especiarias", "minerios", "tesouros"] as const) {
    for (const [id, qty] of Object.entries(loot[kind]).sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(`${LOOT_NAMES[id] ?? id} ×${qty}`);
    }
  }
  return lines;
}

function ItemBlock({
  entry,
  quantity,
}: {
  entry: CompendiumEntry;
  quantity: number;
}) {
  const tags = entrySummary(entry.system, entry.type);
  const desc = stripHtml(entryDescriptionHtml(entry.system));
  return (
    <div className="sheet-pdf-doc__item">
      <h4>
        {entry.name}
        {quantity > 1 ? ` ×${quantity}` : ""}
      </h4>
      {tags.length ? <p>{tags.slice(0, 5).join(" · ")}</p> : null}
      {desc ? <p className="sheet-pdf-doc__muted">{desc.slice(0, 280)}{desc.length > 280 ? "…" : ""}</p> : null}
    </div>
  );
}

export function SheetPdfDocument({ character, inventory }: Props) {
  const { identity, resources, movement, tactical } = character;
  const prof = proficiencyBonus(identity.nivel);
  const defesa = resolveActorDefesa(character);
  const portraitSrc = firstPortraitDataUrl(character.tokenImageUrl, character.portraitUrl);

  const resolved = useMemo(() => resolveInventory(inventory), [inventory]);
  const weapons = resolved.filter((r) => r.entry.type === "arma");
  const gear = resolved.filter((r) => r.entry.type === "equipamento");
  const other = resolved.filter(
    (r) =>
      r.entry.type !== "arma" &&
      r.entry.type !== "equipamento" &&
      r.entry.type !== "magia" &&
      r.entry.type !== "habilidade"
  );
  const abilities = resolved.filter((r) => r.entry.type === "habilidade");
  const spells = resolved.filter((r) => r.entry.type === "magia");

  const loot = loadLoot(character.id, character.lootEconomy ?? EMPTY_LOOT);
  const lootText = lootLines(loot);

  const loadoutWeapon = character.combatLoadout
    ? getEntry(character.combatLoadout.packId, character.combatLoadout.entryId)
    : null;
  const loadoutArmor = character.armorLoadout
    ? getEntry(character.armorLoadout.packId, character.armorLoadout.entryId)
    : null;

  const initials = character.name.trim().slice(0, 2).toUpperCase() || "?";

  return (
    <div className="sheet-pdf-doc">
      <p className="sheet-pdf-doc__brand">Eldarin · Ficha de personagem</p>
      <h1 className="sheet-pdf-doc__title">{character.name}</h1>

      <div className="sheet-pdf-doc__hero">
        {portraitSrc ? (
          <img
            src={portraitSrc}
            alt=""
            className="sheet-pdf-doc__portrait"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="sheet-pdf-doc__portrait sheet-pdf-doc__portrait--empty" aria-hidden>
            {initials}
          </div>
        )}
        <div className="sheet-pdf-doc__identity">
          <p>
            <strong>Nível {identity.nivel}</strong> · {formatXpProgress(identity.nivel, identity.xpTotal ?? 0)}
          </p>
          <p>
            {identity.raca ? <span>{identity.raca}</span> : null}
            {identity.classe ? <span> · {identity.classe}</span> : null}
            {identity.subclasse ? <span> · {identity.subclasse}</span> : null}
          </p>
          {identity.antecedente ? <p>Antecedente: {identity.antecedente}</p> : null}
          {identity.linhagem ? <p>Linhagem: {identity.linhagem}</p> : null}
          {identity.religiao ? (
            <p>Devotion: {religionDisplayName(identity.religiao)}</p>
          ) : null}
          {loadoutWeapon || loadoutArmor ? (
            <p>
              Em uso:{" "}
              {[loadoutWeapon?.name, loadoutArmor?.name].filter(Boolean).join(" · ") || "—"}
            </p>
          ) : null}
        </div>
      </div>

      {character.biography ? (
        <p className="sheet-pdf-doc__bio">{character.biography}</p>
      ) : null}

      <h2>Atributos e combate</h2>
      <table>
        <thead>
          <tr>
            {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((k) => (
              <th key={k}>{ATTRIBUTE_LABELS[k]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((k) => {
              const m = attributeMod(character.attributes[k]);
              return (
                <td key={k}>
                  {character.attributes[k]} ({m >= 0 ? `+${m}` : m})
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>

      <table>
        <tbody>
          <tr>
            <th>Vida</th>
            <td>
              {resources.vida.value}/{resources.vida.max}
            </td>
            <th>PA</th>
            <td>
              {resources.pontosAcao.value}/{resources.pontosAcao.max}
            </td>
            <th>Defesa</th>
            <td>{defesa}</td>
          </tr>
          <tr>
            <th>Iniciativa</th>
            <td>{tactical.iniciativa >= 0 ? `+${tactical.iniciativa}` : tactical.iniciativa}</td>
            <th>Movimento</th>
            <td colSpan={3}>
              {movement.walk} / {movement.run} hex
            </td>
          </tr>
          <tr>
            <th>Bônus prof.</th>
            <td colSpan={5}>+{prof}</td>
          </tr>
        </tbody>
      </table>

      {identity.talentos && identity.talentos.length > 0 ? (
        <>
          <h2>Talentos</h2>
          <ul className="sheet-pdf-doc__muted">
            {identity.talentos.map((t) => (
              <li key={`${t.level}-${t.id}`}>
                Nv {t.level}: {t.name}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {lootText.length > 0 ? (
        <>
          <h2>Tesouro</h2>
          <p>{lootText.join(" · ")}</p>
        </>
      ) : null}

      {weapons.length > 0 ? (
        <>
          <h2>Armas</h2>
          {weapons.map(({ ref, entry }) => (
            <ItemBlock key={ref.instanceId} entry={entry} quantity={ref.quantity} />
          ))}
        </>
      ) : null}

      {gear.length > 0 ? (
        <>
          <h2>Armaduras e equipamento</h2>
          {gear.map(({ ref, entry }) => (
            <ItemBlock key={ref.instanceId} entry={entry} quantity={ref.quantity} />
          ))}
        </>
      ) : null}

      {other.length > 0 ? (
        <>
          <h2>Outros itens</h2>
          {other.map(({ ref, entry }) => (
            <ItemBlock key={ref.instanceId} entry={entry} quantity={ref.quantity} />
          ))}
        </>
      ) : null}

      {abilities.length > 0 ? (
        <>
          <h2>Habilidades</h2>
          {abilities.map(({ ref, entry }) => (
            <ItemBlock key={ref.instanceId} entry={entry} quantity={ref.quantity} />
          ))}
        </>
      ) : null}

      {spells.length > 0 ? (
        <>
          <h2>Magias</h2>
          {spells.map(({ ref, entry }) => (
            <ItemBlock key={ref.instanceId} entry={entry} quantity={ref.quantity} />
          ))}
        </>
      ) : null}

      <p className="sheet-pdf-doc__muted" style={{ marginTop: "1.5em", textAlign: "center" }}>
        Gerado em {new Date().toLocaleString("pt-BR")} · mxdrpg.vercel.app
      </p>
    </div>
  );
}
