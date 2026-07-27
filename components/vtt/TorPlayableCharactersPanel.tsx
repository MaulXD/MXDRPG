"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CULTURE_BY_ID, CALLING_BY_ID } from "@/lib/character/um-anel/data";
import type { TorCharacterSheet } from "@/lib/character/um-anel/types";
import type { Axial } from "@/lib/vtt/grid-math";
import type { RoomSnapshot } from "@/lib/room/types";
import { placeRoomTorCharacterOnCell } from "@/hooks/useRoomSync";

type Props = {
  adventureId: string;
  onOpenSheet: (characterId: string) => void;
  roomId?: string;
  spawnAxial?: Axial | null;
  onPlaced?: (snapshot: RoomSnapshot) => void;
  canCreateCharacter?: boolean;
  onCreateCharacter?: () => void;
};

export function TorPlayableCharactersPanel({
  adventureId,
  onOpenSheet,
  roomId,
  spawnAxial = null,
  onPlaced,
  canCreateCharacter = false,
  onCreateCharacter,
}: Props) {
  const [characters, setCharacters] = useState<TorCharacterSheet[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  async function placeOnMap(characterId: string) {
    if (!roomId || !spawnAxial || busy) return;
    setBusy(true);
    try {
      const snapshot = await placeRoomTorCharacterOnCell(roomId, characterId, spawnAxial.q, spawnAxial.r);
      onPlaced?.(snapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao colocar no mapa");
    } finally {
      setBusy(false);
    }
  }

  const canPlaceOnMap = Boolean(roomId && onPlaced);

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
      {canPlaceOnMap ? (
        <p className="vtt-combat-hint">
          {spawnAxial ? `Célula alvo: q${spawnAxial.q}, r${spawnAxial.r}` : "Passe o mouse no mapa pra escolher a célula."}
        </p>
      ) : null}
      {characters && characters.length > 0 ? (
        <ul className="vtt-playable-list" role="list">
          {characters.map((c) => {
            const culture = CULTURE_BY_ID[c.culture];
            const calling = CALLING_BY_ID[c.calling];
            return (
              <li key={c.id}>
                <button type="button" className="vtt-playable-card" onClick={() => onOpenSheet(c.id)}>
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
                {canPlaceOnMap ? (
                  <button
                    type="button"
                    className="btn btn-ghost vtt-spawn-sheet-btn"
                    disabled={busy || !spawnAxial}
                    onClick={() => void placeOnMap(c.id)}
                  >
                    Colocar no mapa
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {canCreateCharacter ? (
        onCreateCharacter ? (
          <button
            type="button"
            className="btn btn-secondary vtt-playable-create"
            onClick={onCreateCharacter}
          >
            + Criar novo personagem
          </button>
        ) : (
          <Link href={`/aventura/${adventureId}/personagem/novo`} className="btn btn-secondary vtt-playable-create">
            + Criar novo personagem
          </Link>
        )
      ) : null}
    </div>
  );
}
