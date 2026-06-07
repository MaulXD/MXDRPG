"use client";

import { Portrait } from "@/components/vtt/Portrait";
import { OrnamentCard } from "@/components/ui/OrnamentCard";
import { useImageNaturalSize } from "@/hooks/useImageNaturalSize";
import { sanitizePortraitFocus, type PortraitFocus } from "@/lib/media/portrait-focus";
import type { CharacterIdentity } from "@/lib/character/types";
import { religionDisplayName } from "@/lib/character/pantheon";
import { proficiencyBonus } from "@/lib/character/rules";

type Props = {
  name: string;
  identity: CharacterIdentity;
  portraitUrl?: string | null;
  portraitFocus?: PortraitFocus | null;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function CharacterSheetCover({ name, identity, portraitUrl, portraitFocus }: Props) {
  const imgSize = useImageNaturalSize(portraitUrl);
  const focus = sanitizePortraitFocus(portraitFocus) ?? undefined;

  const meta = [
    `Nv ${identity.nivel}`,
    identity.raca,
    identity.linhagem ? `(${identity.linhagem})` : null,
    identity.classe,
    identity.subclasse,
  ]
    .filter(Boolean)
    .join(" · ");

  const sub = [
    identity.antecedente,
    identity.religiao ? religionDisplayName(identity.religiao) : null,
    `Prof +${proficiencyBonus(identity.nivel)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <OrnamentCard className="sheet-header">
      <div className="sheet-header__portrait-wrap">
        <Portrait
          tier="hero"
          imageSrc={portraitUrl}
          initials={portraitUrl ? undefined : initials(name)}
          alt={name}
          focus={focus}
          imgW={imgSize.w}
          imgH={imgSize.h}
          className="portrait--sheet"
        />
      </div>
      <div className="sheet-header__info">
        <p className="eyebrow sheet-header__eyebrow">Personagem</p>
        <h1 className="sheet-header__name">{name}</h1>
        <p className="sheet-header__meta">{meta}</p>
        <p className="sheet-header__meta sheet-header__meta-sub">{sub}</p>
      </div>
    </OrnamentCard>
  );
}
