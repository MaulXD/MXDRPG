"use client";

import { useMemo } from "react";
import type { CharacterSheet, InventoryItem } from "@/lib/character/types";
import type { CompendiumEntry } from "@/lib/compendium/types";
import { getEntry } from "@/lib/compendium/registry";
import { entryBookRef, entryDescriptionHtml, entrySummary, stripHtml } from "@/lib/compendium/format";
import { compendiumTypeColor } from "@/lib/compendium/icons";
import { CompendiumIcon } from "@/components/compendium/CompendiumIcon";
import { CharacterSheetPopupHero } from "@/components/character/CharacterSheetPopupHero";
import { SheetPopupCombatStrip } from "@/components/character/SheetPopupCombatStrip";
import { SheetPopupLoadoutBar } from "@/components/character/SheetPopupLoadoutBar";
import {
  IconArmor,
  IconBackpack,
  IconEye,
  IconLightning,
  IconBook,
  IconSearch,
  IconSword,
  IconWand,
} from "@/components/character/SheetPopupIcons";
import { OrnamentCard } from "@/components/ui/OrnamentCard";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { Portrait } from "@/components/vtt/Portrait";
import { resolveActorDefesa } from "@/lib/character/armor-defense";
import {
  ATTRIBUTE_LABELS,
  attributeMod,
  proficiencyBonus,
  type AttributeKey,
} from "@/lib/character/rules";
import {
  buildSheetQuickSkills,
  buildSheetReligionSkill,
} from "@/lib/character/sheet-skills";
import { firstPortraitDataUrl } from "@/lib/room/portrait-sync";
import { LOOT_NAMES } from "@/lib/character/loot-catalog";
import { EMPTY_LOOT, loadLoot } from "@/lib/character/loot-storage";
import { sanitizePortraitFocus } from "@/lib/media/portrait-focus";
import { MedievalFrame } from "@/components/ui/MedievalFrame";
import "@/components/ui/medieval-borders.css";
import "./sheet.css";
import "./sheet-popup.css";
import "./sheet-pdf-capture.css";

type Props = {
  character: CharacterSheet;
  inventory?: InventoryItem[];
  roomId?: string;
};

const SKILL_ICONS = {
  percepcao: IconEye,
  investigacao: IconSearch,
  iniciativa: IconLightning,
  religiao: IconBook,
} as const;

function resolveInventory(inventory: InventoryItem[] = []) {
  return inventory
    .map((ref) => {
      const entry = getEntry(ref.packId, ref.entryId);
      if (!entry) return null;
      return { ref, entry };
    })
    .filter(Boolean) as Array<{ ref: InventoryItem; entry: CompendiumEntry }>;
}

function lootLines(loot: ReturnType<typeof loadLoot>): string[] {
  const lines: string[] = [];
  if (loot.po > 0) lines.push(`${loot.po} PO`);
  for (const kind of ["especiarias", "minerios", "tesouros"] as const) {
    for (const [id, qty] of Object.entries(loot[kind]).sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(`${LOOT_NAMES[id] ?? id} ×${qty}`);
    }
  }
  return lines;
}

function PdfInventoryRow({
  entry,
  quantity,
}: {
  entry: CompendiumEntry;
  quantity: number;
}) {
  const color = compendiumTypeColor(entry.type);
  const tags = entrySummary(entry.system, entry.type);
  const descriptionText = stripHtml(entryDescriptionHtml(entry.system));
  const { catalogId, bookRef } = entryBookRef(entry.system);

  return (
    <li className="inv-row inv-row--detail">
      <CompendiumIcon entry={entry} color={color} className="inv-icon" />
      <div className="inv-row__body">
        <h4>{entry.name}</h4>
        <p className="inv-row__tags">{tags.slice(0, 4).join(" · ")}</p>
        {descriptionText ? <p className="inv-row__desc">{descriptionText}</p> : null}
        {catalogId || bookRef ? (
          <p className="inv-row__ref">
            {catalogId ? <span className="inv-row__ref-id">{catalogId}</span> : null}
            {catalogId && bookRef ? " · " : null}
            {bookRef ? <span className="inv-row__ref-book">{bookRef}</span> : null}
          </p>
        ) : null}
      </div>
      <span className="inv-type">{entry.type}</span>
      {quantity > 1 ? <span className="inv-type">×{quantity}</span> : null}
    </li>
  );
}

export function SheetPdfCapture({ character, inventory = [], roomId }: Props) {
  const { identity, resources, movement, tactical } = character;
  const prof = proficiencyBonus(identity.nivel);
  const defesa = resolveActorDefesa(character);
  const portraitFocus = sanitizePortraitFocus(character.portraitFocus);
  const portraitSrc = firstPortraitDataUrl(character.tokenImageUrl, character.portraitUrl);
  const initials = character.name.trim().slice(0, 2).toUpperCase() || "?";
  const hpPct =
    resources.vida.max > 0
      ? Math.round((resources.vida.value / resources.vida.max) * 100)
      : 0;

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

  const skills = [...buildSheetQuickSkills(character), buildSheetReligionSkill(character)];

  const noopSave = async () => undefined;

  const mesaHint = roomId
    ? "Toque nas ações rápidas para abrir a mesa e rolar (na sua vez)."
    : "Toque nas ações rápidas para abrir a ficha e rolar na mesa (na sua vez).";

  return (
    <div className="sheet-pdf-capture">
      <MedievalFrame variant="gothic" compact flush className="mf--sheet-page sheet-pdf-capture__frame">
      <div className="sheet-shell sheet-shell--popup">
        <OrnamentCard className="sheet-popup-top">
          <div className="sheet-popup-top__portrait-col">
            {portraitSrc ? (
              <Portrait
                tier="hero"
                imageSrc={portraitSrc}
                alt={character.name}
                focus={portraitFocus ?? undefined}
                className="portrait--sheet-popup"
              />
            ) : (
              <Portrait
                tier="hero"
                initials={initials}
                alt={character.name}
                className="portrait--sheet-popup"
              />
            )}
            <SheetPopupCombatStrip
              defesa={defesa}
              iniciativa={tactical.iniciativa}
              movimentoWalk={movement.walk}
              movimentoRun={movement.run}
              profBonus={prof}
              hpValue={resources.vida.value}
              hpMax={resources.vida.max}
              hpPct={hpPct}
            />
          </div>

          <div className="sheet-popup-top__identity">
            <CharacterSheetPopupHero name={character.name} identity={identity} />
          </div>

          <div className="sheet-popup-top__attrs" role="group" aria-label="Atributos">
            {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((k) => {
              const m = attributeMod(character.attributes[k]);
              const sign = m > 0 ? "pos" : m < 0 ? "neg" : "zero";
              return (
                <div className="sheet-popup-attr sheet-attr-cell" key={k}>
                  <label className="sheet-attr-cell__label">{ATTRIBUTE_LABELS[k]}</label>
                  <strong className="sheet-attr-cell__base">{character.attributes[k]}</strong>
                  <span className="sheet-attr-cell__divider" aria-hidden />
                  <span className={`sheet-attr-cell__mod sheet-attr-cell__mod--${sign}`}>
                    {m >= 0 ? `+${m}` : m}
                  </span>
                </div>
              );
            })}
          </div>
        </OrnamentCard>

        <section className="sheet-popup-quickbar" aria-label="Perícias e ações rápidas">
          <p className="sheet-popup-quickbar__eyebrow">Ações rápidas</p>
          <div className="sheet-popup-quickbar__row">
            {skills.map((skill) => {
              const Icon = SKILL_ICONS[skill.def.id as keyof typeof SKILL_ICONS] ?? IconEye;
              return (
                <div
                  key={skill.def.id}
                  className={`sheet-popup-quickbtn sheet-pdf-link ${skill.trained ? "is-trained" : ""}`}
                  data-pdf-link={`roll:${skill.def.id}`}
                  aria-label={skill.def.label}
                >
                  <Icon size={17} className="sheet-popup-quickbtn__icon" />
                  <span className="sheet-popup-quickbtn__label">{skill.def.short}</span>
                  <strong className="sheet-popup-quickbtn__mod">
                    {skill.passive != null ? skill.passive : skill.display}
                  </strong>
                </div>
              );
            })}
          </div>
        </section>

        <SheetPopupLoadoutBar
          actor={character}
          inventory={inventory}
          canEdit={false}
          onSaved={() => undefined}
          savePatch={noopSave}
          eyebrow="Em uso na mesa"
        />

        <div className="sheet-popup-body">
          <OrnamentCard className="sheet-popup-center sheet-panel">
            {lootText.length > 0 ? (
              <section className="inv-section">
                <header className="inv-section__head">
                  <IconBackpack size={18} className="inv-section__icon" />
                </header>
                <SectionDivider title="Tesouro e riquezas" />
                <p className="inv-section__hint">{lootText.join(" · ")}</p>
              </section>
            ) : null}

            {weapons.length > 0 ? (
              <section className="inv-section">
                <header className="inv-section__head">
                  <IconSword size={18} className="inv-section__icon" />
                  <span className="inv-section__count">{weapons.length}</span>
                </header>
                <SectionDivider title="Armas" />
                <ul className="inv-list">
                  {weapons.map(({ ref, entry }) => (
                    <PdfInventoryRow key={ref.instanceId} entry={entry} quantity={ref.quantity} />
                  ))}
                </ul>
              </section>
            ) : null}

            {gear.length > 0 ? (
              <section className="inv-section">
                <header className="inv-section__head">
                  <IconArmor size={18} className="inv-section__icon" />
                  <span className="inv-section__count">{gear.length}</span>
                </header>
                <SectionDivider title="Armaduras e equipamento" />
                <ul className="inv-list">
                  {gear.map(({ ref, entry }) => (
                    <PdfInventoryRow key={ref.instanceId} entry={entry} quantity={ref.quantity} />
                  ))}
                </ul>
              </section>
            ) : null}

            {other.length > 0 ? (
              <section className="inv-section">
                <header className="inv-section__head">
                  <IconBackpack size={18} className="inv-section__icon" />
                  <span className="inv-section__count">{other.length}</span>
                </header>
                <SectionDivider title="Outros itens" />
                <ul className="inv-list">
                  {other.map(({ ref, entry }) => (
                    <PdfInventoryRow key={ref.instanceId} entry={entry} quantity={ref.quantity} />
                  ))}
                </ul>
              </section>
            ) : null}

            {abilities.length > 0 ? (
              <section className="inv-section">
                <header className="inv-section__head">
                  <IconLightning size={18} className="inv-section__icon" />
                  <span className="inv-section__count">{abilities.length}</span>
                </header>
                <SectionDivider title="Habilidades" />
                <ul className="inv-list">
                  {abilities.map(({ ref, entry }) => (
                    <PdfInventoryRow key={ref.instanceId} entry={entry} quantity={ref.quantity} />
                  ))}
                </ul>
              </section>
            ) : null}

            {spells.length > 0 ? (
              <section className="inv-section">
                <header className="inv-section__head">
                  <IconWand size={18} className="inv-section__icon" />
                  <span className="inv-section__count">{spells.length}</span>
                </header>
                <SectionDivider title="Magias" />
                <ul className="inv-list">
                  {spells.map(({ ref, entry }) => (
                    <PdfInventoryRow key={ref.instanceId} entry={entry} quantity={ref.quantity} />
                  ))}
                </ul>
              </section>
            ) : null}
          </OrnamentCard>
        </div>

        <p className="sheet-pdf-capture__footer">
          Eldarin · Ficha de personagem · Gerado em {new Date().toLocaleString("pt-BR")}
          <br />
          <span className="sheet-pdf-capture__footer-links">{mesaHint}</span>
        </p>
      </div>
      </MedievalFrame>
    </div>
  );
}
