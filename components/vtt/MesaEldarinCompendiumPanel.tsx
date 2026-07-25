"use client";

import { useEffect, useState } from "react";
import { CompendiumBrowser } from "@/components/compendium/CompendiumBrowser";
import type { CompendiumEntry, CompendiumPackId, CompendiumPackMeta } from "@/lib/compendium/types";
import type { UserRole } from "@/lib/auth/types";

type CompendiumApiData = {
  packs: CompendiumPackMeta[];
  data: Record<CompendiumPackId, CompendiumEntry[]>;
  role: UserRole | null;
};

type Props = {
  roomId: string;
};

/** Compêndio Eldarin dentro da mesa — busca via /api/compendium (papel + se é
 * mestre desta sala definem o que aparece, igual à página /compendios). */
export function MesaEldarinCompendiumPanel({ roomId }: Props) {
  const [state, setState] = useState<CompendiumApiData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/compendium?roomId=${encodeURIComponent(roomId)}`, { credentials: "same-origin" })
      .then((res) => res.json())
      .then((json: CompendiumApiData) => {
        if (!cancelled) setState(json);
      })
      .catch(() => {
        if (!cancelled) setError("Falha ao carregar compêndio");
      });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  if (error) return <p className="sheet-inline-msg">{error}</p>;
  if (!state) return <p className="vtt-combat-hint">Carregando…</p>;

  return <CompendiumBrowser packs={state.packs} data={state.data} role={state.role} variant="rail" />;
}
