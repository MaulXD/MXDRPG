"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlayerMonsterKnowledgeView } from "@/lib/bestiary/types";
import { MonsterKnowledgeBlock } from "@/components/vtt/MonsterKnowledgeBlock";

type Props = {
  adventureId: string;
  roomId: string;
  characterName?: string;
  onCountChange?: (count: number) => void;
};

export function PersonalBestiaryPanel({
  adventureId,
  roomId,
  onCountChange,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<PlayerMonsterKnowledgeView[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ roomId });
      const res = await fetch(
        `/api/adventure/${encodeURIComponent(adventureId)}/my-bestiary?${q}`
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        bestiary?: { entries?: PlayerMonsterKnowledgeView[] };
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Falha ao carregar bestiário");
      }
      const list = data.bestiary?.entries ?? [];
      setEntries(list);
      onCountChange?.(list.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
      setEntries([]);
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [adventureId, roomId, onCountChange]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="sheet-bestiary__muted">Carregando bestiário…</p>;
  }

  if (error) {
    return <p className="sheet-bestiary__error">{error}</p>;
  }

  if (entries.length === 0) {
    return (
      <p className="sheet-bestiary__empty">
        Você ainda não registrou combate com criaturas nesta aventura.
      </p>
    );
  }

  return (
    <div className="sheet-bestiary">
      {entries.map((entry) => (
        <MonsterKnowledgeBlock key={entry.typeKey} knowledge={entry} />
      ))}
    </div>
  );
}
