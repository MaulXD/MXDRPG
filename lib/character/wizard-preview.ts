import type { CharacterWizardDraft } from "@/lib/character/wizard-types";
import { attributesAfterRacial } from "@/lib/character/point-buy";
import {
  ATTRIBUTE_LABELS,
  attributeMod,
  getClass,
  getRace,
  hpMaxFor,
} from "@/lib/character/rules";
import { religionDisplayName } from "@/lib/character/pantheon";
import { antecedenteMeta } from "@/lib/character/wizard-meta";
import { listSubclassOptions } from "@/lib/character/level-up-ui";

export type WizardPreviewLine = { label: string; value: string };

export function buildWizardPreview(draft: CharacterWizardDraft): WizardPreviewLine[] {
  const race = getRace(draft.raca);
  const cls = getClass(draft.classe);
  const attrs = attributesAfterRacial(draft.pointBuy, draft.raca, draft.linhagem);
  const conMod = attributeMod(attrs.constituicao);
  const hp = hpMaxFor(draft.classe, 1, conMod);
  const ant = antecedenteMeta(draft.antecedente);
  const tracks = cls ? listSubclassOptions(draft.classe) : [];

  const lines: WizardPreviewLine[] = [
    { label: "Vida nv 1", value: String(hp) },
    { label: "Defesa base", value: String(10 + attributeMod(attrs.destreza)) },
    { label: "Iniciativa", value: `${attributeMod(attrs.destreza) >= 0 ? "+" : ""}${attributeMod(attrs.destreza)}` },
  ];

  if (cls) {
    lines.push({ label: "Proficiências", value: cls.proficiencies });
    lines.push({ label: "Atributo principal", value: cls.primary });
    lines.push({
      label: "Subclasse (nv 2)",
      value: tracks.length
        ? tracks.map((t) => t.subclass).join(" · ")
        : "Escolha na ficha ao subir de nível",
    });
  }

  if (race) {
    lines.push({ label: "Traços raciais", value: race.traits.slice(0, 2).join(" · ") });
    const bonuses = Object.entries(race.attributeBonus)
      .map(([k, v]) => `${ATTRIBUTE_LABELS[k as keyof typeof ATTRIBUTE_LABELS]} +${v}`)
      .join(", ");
    if (bonuses) lines.push({ label: "Bônus de raça", value: bonuses });
  }

  if (draft.raca === "Meio-Humano" && draft.linhagem && race?.linhagens) {
    const lin = race.linhagens.find((l) => l.id === draft.linhagem);
    if (lin) {
      lines.push({ label: "Linhagem", value: `${lin.id} — ${lin.trait}` });
    }
  }

  if (ant) {
    lines.push({ label: "Antecedente", value: ant.gains.join(" · ") });
  }

  if (draft.religiao) {
    lines.push({ label: "Devotion", value: religionDisplayName(draft.religiao) });
  }

  return lines;
}
