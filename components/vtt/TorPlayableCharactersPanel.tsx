"use client";

import { useEffect, useState } from "react";
import { CULTURE_BY_ID, CALLING_BY_ID } from "@/lib/character/um-anel/data";
import type { TorCharacterSheet } from "@/lib/character/um-anel/types";

type Props = {
  adventureId: string;
  onOpenSheet: (characterId: string) => void;
};

export function TorPlayableCharactersPanel({ adventureId, onOpenSheet }: Props) {
  const [characters, setCharacters] = useState<TorCharacterSheet[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/tor-characters?adventureId=${encodeURIComponent(adventureId)}`, {
          credentials: "same-origin",
        });
        const data = (await res.json()) as { characters?: TorCharacterSheet[]; error?: string };
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? "Falha ao carregar personagens");
        setCharacters(data.characters ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Falha ao carregar personagens");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [adventureId]);

  return (
    <div className="vtt-playable-panel">
      <p className="vtt-combat-hint vtt-playable-panel__lead">
        Aventureiros desta mesa — clique pra abrir a ficha e rolar perícias.
      </p>
      {error ? <p className="sheet-inline-msg">{error}</p> : null}
      {characters === null && !error ? <p className="vtt-combat-hint">Carregando…</p> : null}
      {characters && characters.length === 0 ? (
        <p className="vtt-combat-hint">
          Nenhum aventureiro criado ainda — use “Novo personagem” pra criar o primeiro.
        </p>
      ) : null}
      {characters && characters.length > 0 ? (
        <ul className="vtt-playable-list" role="list">
          {characters.map((c) => {
            const culture = CULTURE_BY_ID[c.culture];
            const calling = CALLING_BY_ID[c.calling];
            return (
              <li key={c.id}>
                <button type="button" className="vtt-playable-card vtt-playable-card--draggable" onClick={() => onOpenSheet(c.id)}>
                  <div className="vtt-playable-card__main">
                    <div className="vtt-playable-card__body">
                      <div className="vtt-playable-card__head">
                        <strong>{c.name}</strong>
                      </div>
                      <span className="vtt-playable-card__meta">
                        {culture?.name} · {calling?.name}
                      </span>
                      <span className="vtt-playable-card__meta">
                        Resistência {c.endurance.value}/{c.endurance.max} · Esperança {c.hope.value}/{c.hope.max}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
