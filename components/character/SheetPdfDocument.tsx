"use client";

import { useMemo } from "react";
import type { CharacterSheet, InventoryItem, LootEconomy } from "@/lib/character/types";
import type { CompendiumEntry } from "@/lib/compendium/types";
import { getEntry } from "@/lib/compendium/registry";
import {
  ATTRIBUTE_LABELS,
  attributeMod,
  CULINARY_LABELS,
  proficiencyBonus,
  type AttributeKey,
  type CulinaryKey,
} from "@/lib/character/rules";
import { formatXpProgress } from "@/lib/character/xp";
import { resolveActorDefesa } from "@/lib/character/armor-defense";
import { religionDisplayName } from "@/lib/character/pantheon";
import {
  buildSheetQuickSkills,
  buildSheetReligionSkill,
} from "@/lib/character/sheet-skills";
import { LOOT_NAMES } from "@/lib/character/loot-catalog";
import { EMPTY_LOOT, loadLoot } from "@/lib/character/loot-storage";
import "./sheet-pdf.css";

type Props = {
  character: CharacterSheet;
  inventory: InventoryItem[];
  roomId?: string;
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

function lootSummary(loot: LootEconomy): string {
  const parts: string[] = [];
  if (loot.po > 0) parts.push(`${loot.po} PO`);
  for (const kind of ["especiarias", "minerios", "tesouros"] as const) {
    for (const [id, qty] of Object.entries(loot[kind]).sort(([a], [b]) => a.localeCompare(b))) {
      parts.push(`${LOOT_NAMES[id] ?? id} ×${qty}`);
    }
  }
  return parts.join(" · ");
}

function weaponAttackLine(entry: CompendiumEntry): string {
  const sys = entry.system as {
    ataque?: { bonus?: number };
    dano?: { formula?: string; tipo?: string };
  };
  const bonus = sys.ataque?.bonus;
  const bonusStr = bonus != null && bonus !== 0 ? (bonus >= 0 ? `+${bonus}` : `${bonus}`) : "—";
  const dmg = sys.dano?.formula
    ? `${sys.dano.formula}${sys.dano.tipo ? ` ${sys.dano.tipo}` : ""}`
    : "—";
  return `${entry.name} · ${bonusStr} · ${dmg}`;
}

function compactList(
  items: Array<{ ref: InventoryItem; entry: CompendiumEntry }>,
  max = 8
): string {
  if (!items.length) return "—";
  const shown = items.slice(0, max).map(({ ref, entry }) => {
    const qty = ref.quantity > 1 ? ` ×${ref.quantity}` : "";
    return `${entry.name}${qty}`;
  });
  const extra = items.length > max ? ` (+${items.length - max})` : "";
  return shown.join(" · ") + extra;
}

export function SheetPdfDocument({ character, inventory, roomId }: Props) {
  const { identity, resources, movement, tactical } = character;
  const prof = proficiencyBonus(identity.nivel);
  const defesa = resolveActorDefesa(character);

  const resolved = useMemo(() => resolveInventory(inventory), [inventory]);
  const weapons = resolved.filter((r) => r.entry.type === "arma");
  const gear = resolved.filter((r) => r.entry.type === "equipamento");
  const spells = resolved.filter((r) => r.entry.type === "magia");
  const abilities = resolved.filter((r) => r.entry.type === "habilidade");

  const loot = loadLoot(character.id, character.lootEconomy ?? EMPTY_LOOT);
  const lootText = lootSummary(loot);

  const loadoutWeapon = character.combatLoadout
    ? getEntry(character.combatLoadout.packId, character.combatLoadout.entryId)
    : null;

  const attackLines = [
    loadoutWeapon ? weaponAttackLine(loadoutWeapon) : null,
    ...weapons
      .filter(({ ref }) => ref.entryId !== character.combatLoadout?.entryId)
      .slice(0, loadoutWeapon ? 1 : 2)
      .map(({ entry }) => weaponAttackLine(entry)),
  ].filter(Boolean) as string[];

  const skills = [...buildSheetQuickSkills(character), buildSheetReligionSkill(character)];

  const talentLine =
    identity.talentos && identity.talentos.length > 0
      ? identity.talentos.map((t) => `nv${t.level} ${t.name}`).join(" · ")
      : "—";

  const spellLine = spells.length
    ? spells
        .slice(0, 12)
        .map(({ entry }) => entry.name)
        .join(" · ") + (spells.length > 12 ? ` (+${spells.length - 12})` : "")
    : "—";

  const abilityLine = abilities.length
    ? abilities
        .slice(0, 6)
        .map(({ entry }) => entry.name)
        .join(" · ") + (abilities.length > 6 ? ` (+${abilities.length - 6})` : "")
    : "—";

  return (
    <div className="sheet-pdf-doc">
      <header className="sheet-pdf-doc__head">
        <p className="sheet-pdf-doc__brand">Eldarin v4 · Ficha de personagem</p>
        <h1 className="sheet-pdf-doc__title">{character.name}</h1>
      </header>

      <div className="sheet-pdf-doc__grid">
        <section className="sheet-pdf-doc__col">
          <h2>Identidade · Combate</h2>
          <table className="sheet-pdf-doc__kv">
            <tbody>
              <tr>
                <th>Nível</th>
                <td>{identity.nivel}</td>
                <th>XP</th>
                <td colSpan={3}>{formatXpProgress(identity.nivel, identity.xpTotal ?? 0)}</td>
              </tr>
              <tr>
                <th>Raça</th>
                <td>{identity.raca || "—"}</td>
                <th>Classe</th>
                <td>{identity.classe || "—"}</td>
                <th>Subclasse</th>
                <td>{identity.subclasse || "—"}</td>
              </tr>
              <tr>
                <th>Antecedente</th>
                <td colSpan={2}>{identity.antecedente || "—"}</td>
                <th>Religião</th>
                <td colSpan={2}>
                  {identity.religiao ? religionDisplayName(identity.religiao) : "—"}
                </td>
              </tr>
            </tbody>
          </table>

          <table className="sheet-pdf-doc__attrs">
            <thead>
              <tr>
                {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((k) => (
                  <th key={k}>{ATTRIBUTE_LABELS[k]}</th>
                ))}
                <th>Prof.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((k) => {
                  const m = attributeMod(character.attributes[k]);
                  return (
                    <td key={k}>
                      <span className="sheet-pdf-doc__attr-base">{character.attributes[k]}</span>
                      <span className="sheet-pdf-doc__attr-mod">
                        {m >= 0 ? `+${m}` : m}
                      </span>
                    </td>
                  );
                })}
                <td>+{prof}</td>
              </tr>
            </tbody>
          </table>

          <table className="sheet-pdf-doc__kv">
            <tbody>
              <tr>
                <th>CA</th>
                <td>{defesa}</td>
                <th>HP</th>
                <td>
                  {resources.vida.value}/{resources.vida.max}
                  {resources.vida.temp ? ` (+${resources.vida.temp})` : ""}
                </td>
                <th>PA</th>
                <td>
                  {resources.pontosAcao.value}/{resources.pontosAcao.max}
                </td>
              </tr>
              <tr>
                <th>Inic.</th>
                <td>{tactical.iniciativa >= 0 ? `+${tactical.iniciativa}` : tactical.iniciativa}</td>
                <th>Desloc.</th>
                <td colSpan={3}>
                  {movement.walk}/{movement.run} cél.
                </td>
              </tr>
            </tbody>
          </table>

          <table className="sheet-pdf-doc__attacks">
            <thead>
              <tr>
                <th>Ataque</th>
                <th>Bônus</th>
                <th>Dano</th>
              </tr>
            </thead>
            <tbody>
              {(attackLines.length ? attackLines : ["— · — · —"]).slice(0, 2).map((line, i) => {
                const [name, bonus, dmg] = line.split(" · ");
                return (
                  <tr key={i}>
                    <td>{name}</td>
                    <td>{bonus}</td>
                    <td>{dmg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="sheet-pdf-doc__col">
          <h2>Culinária · Magia</h2>
          <table className="sheet-pdf-doc__culinary">
            <thead>
              <tr>
                {(Object.keys(CULINARY_LABELS) as CulinaryKey[]).map((k) => (
                  <th key={k}>{CULINARY_LABELS[k]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {(Object.keys(CULINARY_LABELS) as CulinaryKey[]).map((k) => (
                  <td key={k}>+{character.culinary[k] ?? 0}</td>
                ))}
              </tr>
            </tbody>
          </table>

          <table className="sheet-pdf-doc__kv">
            <tbody>
              <tr>
                <th>Talentos</th>
                <td>{talentLine}</td>
              </tr>
              <tr>
                <th>Habilidades</th>
                <td>{abilityLine}</td>
              </tr>
              <tr>
                <th>Magias</th>
                <td>{spellLine}</td>
              </tr>
              <tr>
                <th>Armas</th>
                <td>{compactList(weapons, 6)}</td>
              </tr>
              <tr>
                <th>Equip.</th>
                <td>{compactList(gear, 6)}</td>
              </tr>
              <tr>
                <th>Tesouro</th>
                <td>{lootText || "—"}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="sheet-pdf-doc__full">
          <h2>Perícias · Mesa</h2>
          <div className="sheet-pdf-doc__skills">
            {skills.map((skill) => (
              <span
                key={skill.def.id}
                className={`sheet-pdf-doc__skill${roomId ? " sheet-pdf-link" : ""}`}
                {...(roomId ? { "data-pdf-link": `roll:${skill.def.id}` } : {})}
              >
                {skill.def.short}{" "}
                <strong>
                  {skill.passive != null ? skill.passive : skill.display}
                </strong>
                {skill.trained ? " ✓" : ""}
              </span>
            ))}
          </div>
          <p className="sheet-pdf-doc__mesa-hint">
            PA (VTT): nv1=5 · nv5=6 · nv10=7 · nv15=8 · XP monstro = 100×Nv (÷ PCs)
          </p>
          {character.biography ? (
            <p className="sheet-pdf-doc__notes">
              <strong>Notas:</strong> {character.biography.slice(0, 320)}
              {character.biography.length > 320 ? "…" : ""}
            </p>
          ) : null}
        </section>
      </div>

      <footer className="sheet-pdf-doc__foot">
        Gerado em {new Date().toLocaleString("pt-BR")}
        {roomId ? " · Toque nas perícias para abrir a mesa e rolar" : ""}
      </footer>
    </div>
  );
}
