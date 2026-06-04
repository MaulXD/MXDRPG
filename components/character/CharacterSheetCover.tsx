import {
  portraitFocusToImgStyle,
  sanitizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
import type { CharacterIdentity } from "@/lib/character/types";
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
  const focus = sanitizePortraitFocus(portraitFocus);
  const meta = [
    `Nv ${identity.nivel}`,
    identity.raca,
    identity.linhagem ? `(${identity.linhagem})` : null,
    identity.classe,
    identity.subclasse,
  ]
    .filter(Boolean)
    .join(" · ");

  const sub = `${identity.antecedente} · Prof +${proficiencyBonus(identity.nivel)}`;

  return (
    <header className="sheet-cover">
      <div className="sheet-cover-strip" aria-hidden={!portraitUrl}>
        {portraitUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portraitUrl}
            alt=""
            className="sheet-cover-strip-img"
            style={focus ? portraitFocusToImgStyle(focus) : undefined}
          />
        ) : (
          <div className="sheet-cover-strip-fallback">
            <span className="sheet-cover-initials">{initials(name)}</span>
          </div>
        )}
      </div>
      <div className="sheet-cover-info">
        <p className="eyebrow sheet-cover-eyebrow">Personagem</p>
        <h1 className="sheet-cover-name">{name}</h1>
        <p className="sheet-cover-meta">{meta}</p>
        <p className="sheet-cover-meta sheet-cover-meta-sub">{sub}</p>
      </div>
    </header>
  );
}
