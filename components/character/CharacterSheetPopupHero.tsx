"use client";

import type { ReactNode } from "react";
import type { CharacterIdentity } from "@/lib/character/types";
import { religionDisplayName } from "@/lib/character/pantheon";
import { formatXpProgressDetail, xpProgressRatio, MAX_LEVEL } from "@/lib/character/xp";
import { getAscension, getSubclassTrack } from "@/lib/character/subclass-tracks";
import { ReligionDeityIcon } from "@/components/character/ReligionDeityIcon";
import { SheetHoverTip } from "@/components/character/SheetHoverTip";
import {
  backgroundChipTip,
  classChipTip,
  deityChipTip,
  raceChipTip,
  subclassChipTip,
  type SheetTipContent,
} from "@/lib/character/sheet-tooltips";

type Props = {
  name: string;
  identity: CharacterIdentity;
};

function IdentityChip({
  label,
  tip,
  icon,
}: {
  label: string;
  tip: SheetTipContent;
  icon?: ReactNode;
}) {
  return (
    <SheetHoverTip tip={tip}>
      <span className="sheet-popup-identity__chip" tabIndex={0}>
        {icon}
        {label}
      </span>
    </SheetHoverTip>
  );
}

/** Identidade no topo da ficha (nome, chips, nível). */
export function CharacterSheetPopupHero({ name, identity }: Props) {
  const nivel = identity.nivel;
  const xpTotal = identity.xpTotal ?? 0;
  const xpPct = Math.round(xpProgressRatio(nivel, xpTotal) * 100);
  const xpDetail = formatXpProgressDetail(nivel, xpTotal);
  const track = getSubclassTrack(identity.subclasse ?? null);
  const ascension = track ? getAscension(track) : null;

  const raceLabel =
    identity.raca === "Meio-Humano" && identity.linhagem
      ? `${identity.raca} · ${identity.linhagem.replace("Linhagem do ", "")}`
      : identity.raca;

  const chips: { key: string; label: string; tip: SheetTipContent; icon?: ReactNode }[] = [
    { key: "race", label: raceLabel, tip: raceChipTip(identity) },
    { key: "class", label: identity.classe, tip: classChipTip(identity.classe) },
  ];

  if (identity.subclasse) {
    chips.push({
      key: "subclass",
      label: identity.subclasse,
      tip: subclassChipTip(identity.classe, identity.subclasse, nivel),
    });
  }

  if (identity.antecedente) {
    chips.push({
      key: "background",
      label: identity.antecedente,
      tip: backgroundChipTip(identity.antecedente),
    });
  }

  chips.push({
    key: "deity",
    label: identity.religiao ? religionDisplayName(identity.religiao) : "Sem Deus",
    tip: deityChipTip(identity.religiao),
    icon: (
      <ReligionDeityIcon
        religionId={identity.religiao ?? "sem-deus"}
        size={14}
        className="sheet-popup-identity__chip-icon"
      />
    ),
  });

  return (
    <div className="sheet-popup-identity">
      <div className="sheet-popup-identity__head">
        <div className="sheet-popup-identity__main">
          <p className="sheet-popup-identity__eyebrow">Ficha de personagem</p>
          <h2 className="sheet-popup-identity__name">{name}</h2>
          <div className="sheet-popup-identity__chips" role="list" aria-label="Identidade">
            {chips.map((chip) => (
              <IdentityChip key={chip.key} label={chip.label} tip={chip.tip} icon={chip.icon} />
            ))}
          </div>
        </div>

        <div className="sheet-popup-identity__level" aria-label={`Nível ${nivel}`}>
          <div className="sheet-popup-identity__ring">
            <span>{nivel}</span>
          </div>
          <div className="sheet-popup-identity__xp">
            <p className="sheet-popup-identity__xp-primary">{xpDetail.primary}</p>
            <div
              className="sheet-popup-identity__xp-track"
              role="progressbar"
              aria-valuenow={nivel >= MAX_LEVEL ? 100 : xpPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={xpDetail.barLabel}
            >
              <span style={{ width: `${xpPct}%` }} />
            </div>
            <span className="sheet-popup-identity__xp-text">{xpDetail.secondary}</span>
            {nivel >= MAX_LEVEL && ascension ? (
              <SheetHoverTip tip={{ title: ascension.name, lines: ["Ascensão nv. 20 — capstone da subclasse."] }}>
                <span className="sheet-popup-identity__ascension" tabIndex={0}>
                  Ascensão — {ascension.name}
                </span>
              </SheetHoverTip>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
