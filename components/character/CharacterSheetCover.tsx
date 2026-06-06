import {
  portraitFocusToImgStyle,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
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
    <header className="sheet-header">
      <div className="sheet-header__portrait" aria-hidden={!portraitUrl}>
        {portraitUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portraitUrl}
            alt=""
            style={portraitFocus ? portraitFocusToImgStyle(portraitFocus) : undefined}
          />
        ) : (
          <span className="sheet-header__portrait-fallback">{initials(name)}</span>
        )}
      </div>
      <div className="sheet-header__info">
        <p className="eyebrow sheet-header__eyebrow">Personagem</p>
        <h1 className="sheet-header__name">{name}</h1>
        <p className="sheet-header__meta">{meta}</p>
        <p className="sheet-header__meta sheet-header__meta-sub">{sub}</p>
      </div>
    </header>
  );
}
