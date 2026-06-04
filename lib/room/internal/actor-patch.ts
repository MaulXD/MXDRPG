import { applyIdentityPatch, type IdentityPatch } from "@/lib/character/identity";
import type { CharacterSheet } from "@/lib/character/types";
import { validateImageDataUrl } from "@/lib/media/image-data-url";
import { sanitizePortraitFocus } from "@/lib/media/portrait-focus";

export function sanitizeActorPatch(
  patch: Partial<CharacterSheet> & { identityPatch?: IdentityPatch }
): Partial<CharacterSheet> {
  const out: Partial<CharacterSheet> = {};
  if ("portraitUrl" in patch) {
    out.portraitUrl = validateImageDataUrl(patch.portraitUrl);
  }
  if ("tokenImageUrl" in patch) {
    out.tokenImageUrl = validateImageDataUrl(patch.tokenImageUrl);
  }
  if ("portraitFocus" in patch) {
    out.portraitFocus = sanitizePortraitFocus(patch.portraitFocus);
  }
  if ("name" in patch && typeof patch.name === "string" && patch.name.trim()) {
    out.name = patch.name.trim().slice(0, 80);
  }
  if ("biography" in patch && typeof patch.biography === "string") {
    out.biography = patch.biography.slice(0, 2000);
  }
  if ("combatLoadout" in patch) {
    const loadout = patch.combatLoadout;
    if (loadout === null) {
      out.combatLoadout = null;
    } else if (
      loadout &&
      typeof loadout === "object" &&
      (loadout.packId === "armas" || loadout.packId === "magias" || loadout.packId === "habilidades") &&
      typeof loadout.entryId === "string"
    ) {
      out.combatLoadout = { packId: loadout.packId, entryId: loadout.entryId.slice(0, 120) };
    }
  }
  return out;
}

export function mergeIdentityPatch(
  current: CharacterSheet,
  identityPatch?: IdentityPatch
): CharacterSheet {
  if (!identityPatch) return current;
  return applyIdentityPatch(current, identityPatch);
}
