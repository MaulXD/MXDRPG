"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReligionPickGrid } from "@/components/character/ReligionPickGrid";
import { religionDisplayName } from "@/lib/character/pantheon";
import "@/components/world/world-lore.css";

type Props = {
  characterId: string;
  religiao: string;
};

export function CharacterReligionEditor({ characterId, religiao }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(religiao);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(next: string) {
    setValue(next);
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/characters/${characterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ religiao: next }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Falha ao salvar devotion");
      }
      setMsg(`Devotion: ${religionDisplayName(next)}`);
      router.refresh();
    } catch (e) {
      setValue(religiao);
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sheet-religion-edit">
      <p className="eyebrow">Alterar devotion</p>
      <ReligionPickGrid value={value} onChange={save} disabled={busy} />
      {msg ? <p className="sheet-inline-msg">{msg}</p> : null}
    </div>
  );
}
