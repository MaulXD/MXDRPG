import "server-only";

import type { CharacterWizardDraft } from "@/lib/character/wizard-types";
import { normalizeImageDataUrl } from "@/lib/media/image-normalize";

/** Converte imagens do wizard para WebP antes de gravar (descarta JPEG/PNG anterior). */
export async function normalizeWizardDraftImages(
  draft: CharacterWizardDraft
): Promise<CharacterWizardDraft> {
  const portraitUrl = draft.portraitUrl
    ? await normalizeImageDataUrl(draft.portraitUrl, { maxEdge: 1024 })
    : null;
  const tokenImageUrl = draft.tokenImageUrl
    ? await normalizeImageDataUrl(draft.tokenImageUrl, { maxEdge: 512 })
    : null;
  return { ...draft, portraitUrl, tokenImageUrl };
}
